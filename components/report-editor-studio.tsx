"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { dispatchEditorialPaste } from "@/lib/editorial-dispatch";
import { canonicalKeysForSectionId } from "@/lib/editorial/structured-sections";
import { sanitizeReportDraft, StudioReportDraft } from "@/lib/report-builder";
import { createEmptyReport } from "@/lib/templates";
import { MobileReportView } from "@/components/mobile-report-view";
import type { ParsePreviewRow } from "@/lib/gpt-parser/types";
import {
  getLocalReport,
  removeLocalReport,
  upsertLocalReport
} from "@/lib/local-report-cache";

const AUTOSAVE_DELAY_MS = 1400;
const PDF_PREVIEW_DELAY_MS = 900;

type PreviewTab = "mobile" | "pdf";
type AutosaveState = "idle" | "saving" | "saved" | "error";
type SectionField = "intro" | "body" | "quote" | "signature";

function draftHash(draft: StudioReportDraft) {
  const stable = {
    ...draft,
    createdAt: "",
    updatedAt: "",
    share: {
      isPublished: Boolean(draft.share?.isPublished),
      shareToken: draft.share?.shareToken ?? null,
      publishedAt: draft.share?.publishedAt ?? null
    }
  };
  return JSON.stringify(stable);
}

function sectionBody(section: StudioReportDraft["editorialSource"]["sections"][number]) {
  return section.bodyBlocks.map((block) => block.text).join("\n\n");
}

function looksLikeStructuredPayload(raw: string) {
  return raw.includes("===SECTION===") || /^\s*key\s*:/im.test(raw);
}

async function readResponseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
    return fallback;
  } catch {
    return fallback;
  }
}

function updateStructuredSectionField(
  section: StudioReportDraft["editorialSections"][number],
  field: SectionField,
  value: string,
  edited: boolean
) {
  if (field === "intro") {
    return {
      ...section,
      intro: value,
      edited: { ...section.edited, intro: edited }
    };
  }
  if (field === "body") {
    return {
      ...section,
      body: value,
      edited: { ...section.edited, body: edited }
    };
  }
  if (field === "quote") {
    return {
      ...section,
      quote: value,
      edited: { ...section.edited, quote: edited }
    };
  }
  return {
    ...section,
    signature: value,
    edited: { ...section.edited, signature: edited }
  };
}

function reorderById(
  sections: StudioReportDraft["editorialSource"]["sections"],
  sourceId: string,
  targetId: string
) {
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const fromIndex = ordered.findIndex((section) => section.id === sourceId);
  const toIndex = ordered.findIndex((section) => section.id === targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return sections;

  const next = [...ordered];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  return next.map((section, index) => ({ ...section, order: index + 1 }));
}

export default function ReportEditorStudio({ reportId }: { reportId: string }) {
  const [draft, setDraft] = useState<StudioReportDraft | null>(null);
  const [globalPaste, setGlobalPaste] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busySave, setBusySave] = useState(false);
  const [busyPublish, setBusyPublish] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [busyDuplicate, setBusyDuplicate] = useState(false);

  const [status, setStatus] = useState("");
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);

  const [previewTab, setPreviewTab] = useState<PreviewTab>("mobile");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewError, setPdfPreviewError] = useState("");

  const [fullscreen, setFullscreen] = useState(false);
  const [machinePaste, setMachinePaste] = useState("");
  const [parsePreview, setParsePreview] = useState<ParsePreviewRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [canImport, setCanImport] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const lastSavedHashRef = useRef<string>("");
  const pdfRequestRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/reports/${reportId}`);
        if (!response.ok) {
          if (response.status === 404) {
            const local = getLocalReport(reportId);
            if (local) {
              const safeLocal = sanitizeReportDraft(local);
              setDraft(safeLocal);
              setStatus("Analyse locale restauree. Pense a ENREGISTRER pour resynchroniser.");
              setMachinePaste("");
              setParsePreview(null);
              setParseErrors([]);
              setCanImport(false);
              lastSavedHashRef.current = draftHash(safeLocal);
              setAutosaveState("idle");
              return;
            }
          }
          setError(response.status === 404 ? "Rapport introuvable." : "Impossible de charger le rapport.");
          return;
        }
        const data = (await response.json()) as { report: StudioReportDraft };
        if (!mounted) return;
        const safe = sanitizeReportDraft(data.report);
        setDraft(safe);
        setMachinePaste("");
        setParsePreview(null);
        setParseErrors([]);
        setCanImport(false);
        lastSavedHashRef.current = draftHash(safe);
        setAutosaveState("idle");
      } catch {
        if (mounted) setError("Impossible de charger le rapport.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [reportId]);

  useEffect(() => {
    document.body.classList.toggle("studio-fullscreen", fullscreen);
    return () => document.body.classList.remove("studio-fullscreen");
  }, [fullscreen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const sections = useMemo(
    () => (draft ? [...draft.editorialSource.sections].sort((a, b) => a.order - b.order) : []),
    [draft]
  );

  function updateDraft(next: StudioReportDraft) {
    setDraft(sanitizeReportDraft(next));
  }

  function resetDraftContent() {
    if (!draft) return;
    const confirmed = window.confirm("Reinitialiser le contenu pour saisir une nouvelle analyse ?");
    if (!confirmed) return;

    const fresh = createEmptyReport(draft.mode);
    const nextDraft = sanitizeReportDraft({
      ...fresh,
      id: draft.id,
      createdAt: draft.createdAt,
      updatedAt: new Date().toISOString()
    });

    setDraft(nextDraft);
    setGlobalPaste("");
    setMachinePaste("");
    setParsePreview(null);
    setParseErrors([]);
    setCanImport(false);
    setStatus("Contenu reinitialise. Saisis une nouvelle analyse puis ENREGISTRER.");
  }

  async function persistDraft(sourceDraft: StudioReportDraft, options?: { silent?: boolean }) {
    const silent = Boolean(options?.silent);
    if (silent) setAutosaveState("saving");
    else {
      setBusySave(true);
      setStatus("");
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceDraft)
      });
      if (!response.ok) {
        const message = await readResponseError(response, "Echec de la sauvegarde.");
        if (silent) setAutosaveState("error");
        else setStatus(message);
        return false;
      }

      const data = (await response.json()) as { report: StudioReportDraft };
      const safe = sanitizeReportDraft(data.report);
      const savedHash = draftHash(safe);
      lastSavedHashRef.current = savedHash;
      setDraft(safe);
      upsertLocalReport(safe);

      if (silent) {
        setAutosaveState("saved");
        setLastAutosaveAt(new Date().toLocaleTimeString("fr-FR"));
      } else {
        setStatus("Sauvegarde terminee.");
      }
      return true;
    } catch {
      if (silent) setAutosaveState("error");
      else setStatus("Echec de la sauvegarde.");
      return false;
    } finally {
      if (!silent) setBusySave(false);
    }
  }

  useEffect(() => {
    if (!draft || loading) return;
    const hash = draftHash(draft);
    if (hash === lastSavedHashRef.current) return;

    const timer = window.setTimeout(() => {
      void persistDraft(draft, { silent: true });
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [draft, loading]);

  useEffect(() => {
    if (!draft) return;

    const requestId = ++pdfRequestRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setPdfPreviewLoading(true);
        setPdfPreviewError("");
        const response = await fetch("/api/reports/preview-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal: controller.signal
        });
        if (!response.ok) throw new Error("preview_failed");
        const blob = await response.blob();
        if (requestId !== pdfRequestRef.current) return;
        const nextUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
      } catch {
        if (!controller.signal.aborted) setPdfPreviewError("Preview PDF indisponible pour le moment.");
      } finally {
        if (!controller.signal.aborted && requestId === pdfRequestRef.current) setPdfPreviewLoading(false);
      }
    }, PDF_PREVIEW_DELAY_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [draft]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!draft) return;
      const withModifier = event.metaKey || event.ctrlKey;
      if (!withModifier) return;

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persistDraft(draft);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void dispatchPaste();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [draft, globalPaste]);

  function scrollToSection(sectionId: string) {
    const target = document.getElementById(`section-${sectionId}`);
    if (!target) return;
    setActiveSection(sectionId);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function dispatchPaste() {
    if (!draft || !globalPaste.trim()) return;

    if (looksLikeStructuredPayload(globalPaste)) {
      setImportBusy(true);
      setStatus("");
      try {
        const response = await fetch(`/api/reports/${reportId}/import-structured`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw: globalPaste })
        });

        const data = (await response.json()) as {
          report?: StudioReportDraft;
          blockingErrors?: string[];
          error?: string;
        };

        if (!response.ok || !data.report) {
          setParseErrors(data.blockingErrors ?? [data.error ?? "Import structure impossible"]);
          setStatus("Import structure detecte mais bloque.");
          return;
        }

        const safe = sanitizeReportDraft(data.report);
        setDraft(safe);
        lastSavedHashRef.current = draftHash(safe);
        setParseErrors([]);
        setMachinePaste(globalPaste);
        setCanImport(true);
        setStatus("Import structure applique depuis le collage global.");
      } catch {
        setStatus("Import structure impossible pour le moment.");
      } finally {
        setImportBusy(false);
      }
      return;
    }

    const dispatched = dispatchEditorialPaste(globalPaste, draft.editorialSource.sections, draft.mode);
    updateDraft({ ...draft, editorialSource: { sections: dispatched } });
    setStatus("Dispatch applique.");
  }

  async function previewStructuredImport() {
    if (!draft) return;
    if (!machinePaste.trim()) {
      setStatus("Colle une sortie machine avant de lancer la previsualisation.");
      setCanImport(false);
      return;
    }

    setPreviewBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/reports/parse-structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: machinePaste, mode: draft.mode })
      });

      const data = (await response.json()) as {
        preview?: ParsePreviewRow[];
        canImport?: boolean;
        parsed?: {
          errors?: Array<{ message: string }>;
          warnings?: Array<{ message: string }>;
          confidenceScore?: number;
        };
      };

      const errors = [
        ...(data.parsed?.errors?.map((entry) => entry.message) ?? []),
        ...(data.parsed?.warnings?.map((entry) => entry.message) ?? [])
      ];

      setParsePreview(data.preview ?? []);
      setParseErrors(errors);
      setCanImport(Boolean(data.canImport));
      if (data.canImport) {
        setStatus(`Parsing valide (${data.parsed?.confidenceScore ?? 0}/100). Import autorise.`);
      } else {
        setStatus(`Parsing incomplet (${data.parsed?.confidenceScore ?? 0}/100). Import bloque.`);
      }
    } catch {
      setParsePreview(null);
      setParseErrors(["Previsualisation impossible pour le moment."]);
      setCanImport(false);
      setStatus("Previsualisation impossible pour le moment.");
    } finally {
      setPreviewBusy(false);
    }
  }

  async function commitStructuredImport() {
    if (!canImport) {
      setStatus("Import bloque: previsualisation non validee.");
      return;
    }

    setImportBusy(true);
    setStatus("");
    try {
      const response = await fetch(`/api/reports/${reportId}/import-structured`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: machinePaste })
      });

      const data = (await response.json()) as {
        report?: StudioReportDraft;
        blockingErrors?: string[];
        error?: string;
      };

      if (!response.ok || !data.report) {
        setParseErrors(data.blockingErrors ?? [data.error ?? "Import impossible"]);
        setCanImport(false);
        setStatus("Import bloque.");
        return;
      }

      const safe = sanitizeReportDraft(data.report);
      setDraft(safe);
      lastSavedHashRef.current = draftHash(safe);
      setParseErrors([]);
      setStatus("Import structure applique aux sections du rapport.");
    } catch {
      setParseErrors(["Import impossible pour le moment."]);
      setCanImport(false);
      setStatus("Import impossible pour le moment.");
    } finally {
      setImportBusy(false);
    }
  }

  function updateSectionField(sectionId: string, field: SectionField, value: string) {
    if (!draft) return;
    const canonicalKeys = new Set(canonicalKeysForSectionId(sectionId, draft.mode));

    const nextSourceSections = draft.editorialSource.sections.map((section) => {
      if (section.id !== sectionId) return section;

      const edited = { ...section.edited, [field]: true };
      if (field === "intro") return { ...section, intro: value, edited };
      if (field === "quote") return { ...section, pullQuote: value, edited };
      if (field === "signature") {
        return {
          ...section,
          signatureBox: {
            label: section.signatureBox?.label || "En une phrase",
            text: value
          },
          edited
        };
      }

      const blocks = value
        .split(/\n{2,}/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((text, index) => ({ id: `${sectionId}_b${index + 1}`, text }));
      return { ...section, bodyBlocks: blocks, edited };
    });

    const nextStructuredSections = draft.editorialSections.map((section) =>
      canonicalKeys.has(section.key)
        ? updateStructuredSectionField(section, field, value, true)
        : section
    );

    updateDraft({
      ...draft,
      editorialSource: { sections: nextSourceSections },
      editorialSections: nextStructuredSections
    });
  }

  function resetSectionField(sectionId: string, field: SectionField) {
    if (!draft) return;
    const canonicalKeys = new Set(canonicalKeysForSectionId(sectionId, draft.mode));

    const nextSourceSections = draft.editorialSource.sections.map((section) => {
      if (section.id !== sectionId) return section;

      const edited = { ...section.edited, [field]: false };
      if (field === "intro") return { ...section, intro: "", edited };
      if (field === "quote") return { ...section, pullQuote: "", edited };
      if (field === "signature") {
        return {
          ...section,
          signatureBox: {
            label: section.signatureBox?.label || "En une phrase",
            text: ""
          },
          edited
        };
      }
      return { ...section, bodyBlocks: [], edited };
    });

    const nextStructuredSections = draft.editorialSections.map((section) =>
      canonicalKeys.has(section.key)
        ? updateStructuredSectionField(section, field, "", false)
        : section
    );

    updateDraft({
      ...draft,
      editorialSource: { sections: nextSourceSections },
      editorialSections: nextStructuredSections
    });
  }

  function handleDropOnSection(targetId: string) {
    if (!draft || !dragSectionId) return;
    const reordered = reorderById(draft.editorialSource.sections, dragSectionId, targetId);
    updateDraft({ ...draft, editorialSource: { sections: reordered } });
    setDragSectionId(null);
    setStatus("Ordre des sections mis a jour.");
  }

  async function togglePublish() {
    if (!draft) return;
    setBusyPublish(true);
    setStatus("");
    const endpoint = draft.share?.isPublished ? "unpublish" : "publish";

    try {
      const response = await fetch(`/api/reports/${reportId}/${endpoint}`, { method: "POST" });
      if (!response.ok) {
        setStatus("Action de publication indisponible.");
        return;
      }
      const data = (await response.json()) as { report: StudioReportDraft };
      const safe = sanitizeReportDraft(data.report);
      setDraft(safe);
      lastSavedHashRef.current = draftHash(safe);
      setStatus(draft.share?.isPublished ? "Lien mobile depublie." : "Lien mobile publie.");
    } catch {
      setStatus("Action de publication indisponible.");
    } finally {
      setBusyPublish(false);
    }
  }

  async function duplicate() {
    setBusyDuplicate(true);
    setStatus("");
    try {
      const response = await fetch(`/api/reports/${reportId}/duplicate`, { method: "POST" });
      if (!response.ok) {
        setStatus("Duplication impossible.");
        return;
      }
      const data = (await response.json()) as { report?: { id: string } };
      if (data.report?.id) {
        window.location.assign(`/reports/${data.report.id}/edit`);
        return;
      }
      setStatus("Duplication terminee.");
    } catch {
      setStatus("Duplication impossible.");
    } finally {
      setBusyDuplicate(false);
    }
  }

  async function removeReport() {
    setBusyDelete(true);
    setStatus("");
    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await readResponseError(response, "Suppression impossible.");
        setStatus(message);
        return;
      }
      removeLocalReport(reportId);
      window.location.assign("/dashboard");
    } catch {
      setStatus("Suppression impossible.");
    } finally {
      setBusyDelete(false);
    }
  }

  function updateThemeInput(field: "rawInputA" | "rawInputB", value: string) {
    if (!draft) return;
    updateDraft({
      ...draft,
      [field]: value
    });
  }

  function updateSoloSubjectField(
    field: "firstName" | "birthDate" | "birthTime" | "birthPlace",
    value: string
  ) {
    if (!draft || draft.mode !== "solo" || !draft.subjects.solo) return;
    updateDraft({
      ...draft,
      subjects: {
        ...draft.subjects,
        solo: {
          ...draft.subjects.solo,
          [field]: value
        }
      }
    });
  }

  function updateCompatibilitySubjectField(
    personKey: "personA" | "personB",
    field: "firstName" | "birthDate" | "birthTime" | "birthPlace",
    value: string
  ) {
    if (!draft || draft.mode !== "compatibility") return;
    const subject = draft.subjects[personKey];
    if (!subject) return;

    updateDraft({
      ...draft,
      subjects: {
        ...draft.subjects,
        [personKey]: {
          ...subject,
          [field]: value
        }
      }
    });
  }

  async function openPdfPreviewFromDraft(kind: "editorial" | "technical") {
    if (!draft) return false;
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");

    try {
      const endpoint = kind === "technical"
        ? "/api/reports/preview-pdf?kind=technical"
        : "/api/reports/preview-pdf";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });

      if (!response.ok) {
        if (popup) popup.close();
        setStatus(`Impossible de generer le PDF ${kind === "technical" ? "technique" : "editorial"}.`);
        return false;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (popup) {
        popup.location.href = objectUrl;
      } else {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return true;
    } catch {
      if (popup) popup.close();
      setStatus(`Impossible de generer le PDF ${kind === "technical" ? "technique" : "editorial"}.`);
      return false;
    }
  }

  async function openTechnicalPdfFromStudio() {
    if (!draft) return;
    const saved = await persistDraft(draft, { silent: true });
    const opened = await openPdfPreviewFromDraft("technical");
    if (!opened) return;
    setStatus(
      saved
        ? "PDF technique genere."
        : "PDF technique genere depuis le brouillon local (sauvegarde distante indisponible)."
    );
  }

  if (loading) return <div className="studio-loading">Chargement du studio...</div>;
  if (error || !draft) {
    return (
      <div className="studio-loading stack">
        <p>{error || "Rapport introuvable."}</p>
        <Link className="button-secondary" href="/dashboard">Retour dashboard</Link>
      </div>
    );
  }

  const safeDraft = draft;
  const analysisLabel = safeDraft.mode === "compatibility" ? "ANALYSE 2" : "ANALYSE 1";
  const publishLabel = safeDraft.share?.isPublished ? "DEPUBLIER" : "PUBLIER";
  const shareUrl = draft.share?.isPublished && draft.share.shareToken
    ? `/r/${draft.share.shareToken}`
    : null;

  function renderActionButtons() {
    return (
      <>
        <button className="button" type="button" onClick={() => void persistDraft(safeDraft)} disabled={busySave}>
          {busySave ? "ENREGISTRER..." : "ENREGISTRER"}
        </button>
        <button className="button-secondary" type="button" onClick={resetDraftContent} disabled={busySave}>
          REINITIALISER
        </button>
        <button className="button-secondary" type="button" onClick={() => void removeReport()} disabled={busyDelete}>
          {busyDelete ? "SUPPRIMER..." : "SUPPRIMER"}
        </button>
        <button className="button-secondary" type="button" onClick={() => void togglePublish()} disabled={busyPublish}>
          {busyPublish ? `${publishLabel}...` : publishLabel}
        </button>
        <Link className="button-ghost" href={`/reports/${reportId}`}>APERCU</Link>
        <a className="button-ghost" href={`/api/reports/${reportId}/pdf?preview=1`} target="_blank" rel="noreferrer">{analysisLabel}</a>
        <button className="button-ghost" type="button" onClick={() => void openTechnicalPdfFromStudio()}>
          GPT
        </button>
        <button
          className="button-ghost"
          type="button"
          onClick={() => shareUrl ? window.open(shareUrl, "_blank", "noopener,noreferrer") : undefined}
          disabled={!shareUrl}
        >
          MOBILE
        </button>
        <button className="button-ghost" type="button" onClick={() => void duplicate()} disabled={busyDuplicate}>
          {busyDuplicate ? "COPIE..." : "COPIE"}
        </button>
        <button className="button-ghost" type="button" onClick={() => setFullscreen((current) => !current)}>
          {fullscreen ? "ECRAN STANDARD" : "PLEIN ECRAN"}
        </button>
      </>
    );
  }

  return (
    <div className={`studio-grid ${fullscreen ? "is-fullscreen" : ""}`}>
      <aside className="studio-sidebar">
        <div className="studio-sidebar__head">
          <div className="section-kicker">Studio prive premium</div>
          <h2>Structure</h2>
          <p>{draft.meta.title}</p>
          <div className={`studio-autosave ${autosaveState}`}>
            {autosaveState === "saving" ? "Autosave..." : null}
            {autosaveState === "saved" ? `Autosave OK${lastAutosaveAt ? ` (${lastAutosaveAt})` : ""}` : null}
            {autosaveState === "error" ? "Autosave en echec" : null}
          </div>
        </div>

        <div className="studio-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`studio-nav__item ${activeSection === section.id ? "is-active" : ""}`}
              onClick={() => scrollToSection(section.id)}
            >
              <span>{String(section.order).padStart(2, "0")}</span>
              <strong>{section.title}</strong>
            </button>
          ))}
        </div>

        <div className="studio-actions">{renderActionButtons()}</div>
      </aside>

      <section className="studio-editor">
        <div className="studio-panel global-paste">
          <h3>Actions rapides</h3>
          <div className="button-row">{renderActionButtons()}</div>
        </div>

        <div className="studio-panel global-paste">
          <h3>Donnees du theme & brief technique</h3>

          {draft.mode === "solo" ? (
            <>
              <div className="field-grid columns-4">
                <div className="field">
                  <label>Prenom</label>
                  <input
                    className="input"
                    value={draft.subjects.solo?.firstName ?? ""}
                    onChange={(event) => updateSoloSubjectField("firstName", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Date de naissance</label>
                  <input
                    className="input"
                    value={draft.subjects.solo?.birthDate ?? ""}
                    onChange={(event) => updateSoloSubjectField("birthDate", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Heure</label>
                  <input
                    className="input"
                    value={draft.subjects.solo?.birthTime ?? ""}
                    onChange={(event) => updateSoloSubjectField("birthTime", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Lieu</label>
                  <input
                    className="input"
                    value={draft.subjects.solo?.birthPlace ?? ""}
                    onChange={(event) => updateSoloSubjectField("birthPlace", event.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Donnees astro brutes (theme)</label>
                <textarea
                  className="textarea textarea--xl"
                  value={draft.rawInputA}
                  onChange={(event) => updateThemeInput("rawInputA", event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="field-grid columns-2">
                <div className="field">
                  <label>Prenom profil A</label>
                  <input
                    className="input"
                    value={draft.subjects.personA?.firstName ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personA", "firstName", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Prenom profil B</label>
                  <input
                    className="input"
                    value={draft.subjects.personB?.firstName ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personB", "firstName", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid columns-2">
                <div className="field">
                  <label>Date profil A</label>
                  <input
                    className="input"
                    value={draft.subjects.personA?.birthDate ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personA", "birthDate", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Date profil B</label>
                  <input
                    className="input"
                    value={draft.subjects.personB?.birthDate ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personB", "birthDate", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid columns-2">
                <div className="field">
                  <label>Heure profil A</label>
                  <input
                    className="input"
                    value={draft.subjects.personA?.birthTime ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personA", "birthTime", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Heure profil B</label>
                  <input
                    className="input"
                    value={draft.subjects.personB?.birthTime ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personB", "birthTime", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid columns-2">
                <div className="field">
                  <label>Lieu profil A</label>
                  <input
                    className="input"
                    value={draft.subjects.personA?.birthPlace ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personA", "birthPlace", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Lieu profil B</label>
                  <input
                    className="input"
                    value={draft.subjects.personB?.birthPlace ?? ""}
                    onChange={(event) => updateCompatibilitySubjectField("personB", "birthPlace", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid columns-2">
                <div className="field">
                  <label>Donnees astro brutes (profil A)</label>
                  <textarea
                    className="textarea textarea--xl"
                    value={draft.rawInputA}
                    onChange={(event) => updateThemeInput("rawInputA", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Donnees astro brutes (profil B)</label>
                  <textarea
                    className="textarea textarea--xl"
                    value={draft.rawInputB ?? ""}
                    onChange={(event) => updateThemeInput("rawInputB", event.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="button-row">
            <button className="button-secondary" type="button" onClick={() => void openTechnicalPdfFromStudio()}>
              GPT
            </button>
          </div>
        </div>

        <div className="studio-panel global-paste">
          <h3>Collage global intelligent</h3>
          <textarea
            placeholder="Colle l'analyse complete ici puis applique le dispatch."
            value={globalPaste}
            onChange={(event) => setGlobalPaste(event.target.value)}
          />
          <div className="button-row">
            <button className="button-secondary" type="button" onClick={() => void dispatchPaste()} disabled={importBusy}>
              {importBusy ? "Import..." : "Dispatcher"}
            </button>
          </div>
          {status ? <p className="muted-note">{status}</p> : null}
          <p className="muted-note">Raccourcis: Ctrl/Cmd+S pour sauvegarder, Ctrl/Cmd+Entree pour dispatcher.</p>
        </div>

        <div className="studio-panel global-paste">
          <h3>Import structure GPT</h3>
          <textarea
            placeholder="Colle ici la sortie machine avec ===SECTION===, key:, title:, subtitle:, intro:, body:, quote:, signature:."
            value={machinePaste}
            onChange={(event) => {
              setMachinePaste(event.target.value);
              setCanImport(false);
            }}
          />
          <div className="button-row">
            <button className="button-secondary" type="button" onClick={() => void previewStructuredImport()} disabled={previewBusy}>
              {previewBusy ? "Previsualisation..." : "Previsualiser le parsing"}
            </button>
            <button className="button" type="button" onClick={() => void commitStructuredImport()} disabled={!canImport || importBusy}>
              {importBusy ? "Import..." : "Importer dans les sections"}
            </button>
          </div>

          {parseErrors.length > 0 ? (
            <div className="parse-preview__notes">
              {parseErrors.map((entry, index) => (
                <p key={`${entry}-${index}`}>{entry}</p>
              ))}
            </div>
          ) : null}

          {parsePreview ? (
            <div className="parse-preview">
              <div className="parse-preview__header">
                <strong>Preview parsing</strong>
                <span>{canImport ? "Import autorise" : "Import bloque"}</span>
                <span>Sections: {parsePreview.length}</span>
              </div>
              <div className="parse-preview__table">
                {parsePreview.map((row) => (
                  <div key={row.key} className={`parse-preview__row ${row.found ? "" : "is-missing"}`}>
                    <div className="parse-preview__title">{row.title}</div>
                    <div className="parse-preview__meta">
                      <span>Intro: {row.introLength}</span>
                      <span>Body: {row.bodyLength}</span>
                      <span>Quote: {row.quoteLength}</span>
                      <span>Signature: {row.signatureLength}</span>
                      <span>Confiance: {row.confidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {sections.map((section) => (
          <article
            key={section.id}
            id={`section-${section.id}`}
            className={`studio-panel editor-section ${dragSectionId === section.id ? "is-dragging" : ""}`}
            draggable
            onDragStart={() => setDragSectionId(section.id)}
            onDragEnd={() => setDragSectionId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropOnSection(section.id)}
          >
            <div className="editor-section__handle">Glisser pour reordonner</div>
            <div className="section-kicker">{String(section.order).padStart(2, "0")}</div>
            <h3>{section.title}</h3>
            <p>{section.subtitle}</p>

            <div className="field">
              <div className="field__head">
                <label>Intro</label>
                <div className="field__meta">
                  <span className={`field-status ${section.edited?.intro ? "is-edited" : "is-generated"}`}>
                    {section.edited?.intro ? "Modifie" : "Genere"}
                  </span>
                  <button
                    type="button"
                    className="field-reset"
                    onClick={() => resetSectionField(section.id, "intro")}
                    disabled={!section.edited?.intro && !(section.intro ?? "").trim()}
                  >
                    Reinitialiser
                  </button>
                </div>
              </div>
              <textarea
                className="textarea"
                value={section.intro ?? ""}
                onChange={(event) => updateSectionField(section.id, "intro", event.target.value)}
              />
            </div>

            <div className="field">
              <div className="field__head">
                <label>Corps editorial</label>
                <div className="field__meta">
                  <span className={`field-status ${section.edited?.body ? "is-edited" : "is-generated"}`}>
                    {section.edited?.body ? "Modifie" : "Genere"}
                  </span>
                  <button
                    type="button"
                    className="field-reset"
                    onClick={() => resetSectionField(section.id, "body")}
                    disabled={!section.edited?.body && !sectionBody(section).trim()}
                  >
                    Reinitialiser
                  </button>
                </div>
              </div>
              <textarea
                className="textarea textarea--xl"
                value={sectionBody(section)}
                onChange={(event) => updateSectionField(section.id, "body", event.target.value)}
              />
            </div>

            <div className="field-grid columns-2">
              <div className="field">
                <div className="field__head">
                  <label>Citation</label>
                  <div className="field__meta">
                    <span className={`field-status ${section.edited?.quote ? "is-edited" : "is-generated"}`}>
                      {section.edited?.quote ? "Modifie" : "Genere"}
                    </span>
                    <button
                      type="button"
                      className="field-reset"
                      onClick={() => resetSectionField(section.id, "quote")}
                      disabled={!section.edited?.quote && !(section.pullQuote ?? "").trim()}
                    >
                      Reinitialiser
                    </button>
                  </div>
                </div>
                <textarea
                  className="textarea"
                  value={section.pullQuote ?? ""}
                  onChange={(event) => updateSectionField(section.id, "quote", event.target.value)}
                />
              </div>
              <div className="field">
                <div className="field__head">
                  <label>Encadre signature</label>
                  <div className="field__meta">
                    <span className={`field-status ${section.edited?.signature ? "is-edited" : "is-generated"}`}>
                      {section.edited?.signature ? "Modifie" : "Genere"}
                    </span>
                    <button
                      type="button"
                      className="field-reset"
                      onClick={() => resetSectionField(section.id, "signature")}
                      disabled={!section.edited?.signature && !(section.signatureBox?.text ?? "").trim()}
                    >
                      Reinitialiser
                    </button>
                  </div>
                </div>
                <textarea
                  className="textarea"
                  value={section.signatureBox?.text ?? ""}
                  onChange={(event) => updateSectionField(section.id, "signature", event.target.value)}
                />
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="studio-preview">
        <div className="studio-preview__head">
          <div className="section-kicker">Preview live</div>
          <h2>Mobile et PDF</h2>
          <div className="studio-preview-tabs">
            <button
              type="button"
              className={`tab ${previewTab === "mobile" ? "is-active" : ""}`}
              onClick={() => setPreviewTab("mobile")}
            >
              Mobile
            </button>
            <button
              type="button"
              className={`tab ${previewTab === "pdf" ? "is-active" : ""}`}
              onClick={() => setPreviewTab("pdf")}
            >
              PDF live
            </button>
          </div>
        </div>

        {previewTab === "mobile" ? (
          <MobileReportView report={draft} />
        ) : (
          <div className="studio-pdf-live">
            {pdfPreviewLoading ? <p className="muted-note">Generation de la preview PDF...</p> : null}
            {pdfPreviewError ? <p className="muted-note">{pdfPreviewError}</p> : null}
            {pdfPreviewUrl ? (
              <iframe
                title="PDF live preview"
                src={pdfPreviewUrl}
                className="studio-pdf-iframe"
              />
            ) : null}
          </div>
        )}
      </aside>

      <button
        className="floating-save-button floating-save-button--studio"
        type="button"
        onClick={() => void persistDraft(safeDraft)}
        disabled={busySave}
        aria-label="Enregistrer la saisie"
      >
        {busySave ? "ENREGISTRER..." : "ENREGISTRER"}
      </button>
    </div>
  );
}
