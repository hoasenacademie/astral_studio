"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEmptyReport } from "@/lib/templates";
import { sanitizeReportDraft } from "@/lib/report-builder";
import { ReportRecord, ReportMode } from "@/lib/types";
import { ParsedTables } from "@/components/parsed-tables";
import { ReportPreview } from "@/components/report-preview";
import { dispatchEditorialPaste } from "@/lib/editorial-dispatch";
import { applyStructuredSectionsToSource } from "@/lib/editorial/structured-sections";
import { parseGptStructuredNarrative } from "@/lib/gpt-parser/parser";
import { mapParsedSectionsToEditorialSections } from "@/lib/reports/injection";
import { getChartSignaturePoints } from "@/lib/chart-signatures";
import { SignaturePointsStrip } from "@/components/signature-points-strip";
import { EnhancedInput } from "@/components/enhanced-input";

const previewTabs = [
  { key: "editor", label: "Édition" },
  { key: "preview", label: "APERCU" }
] as const;

export function ReportEditor({
  mode,
  initialReport,
  persistMode = "create"
}: {
  mode: ReportMode;
  initialReport?: ReportRecord;
  persistMode?: "create" | "edit";
}) {
  const [draft, setDraft] = useState<ReportRecord>(() => sanitizeReportDraft(initialReport ?? createEmptyReport(mode)));
  const [tab, setTab] = useState<(typeof previewTabs)[number]["key"]>("editor");
  const [saving, setSaving] = useState(false);
  const [busyPublish, setBusyPublish] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [globalPaste, setGlobalPaste] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const router = useRouter();
  const draftBackupKey = `astral:report-draft:${mode}`;

  const isEditMode = persistMode === "edit";
  const [isPersisted, setIsPersisted] = useState(isEditMode);
  const safeDraft = useMemo(() => sanitizeReportDraft(draft), [draft]);
  const pointsA = useMemo(() => getChartSignaturePoints(safeDraft.parsedA), [safeDraft.parsedA]);
  const pointsB = useMemo(
    () => (safeDraft.mode === "compatibility" ? getChartSignaturePoints(safeDraft.parsedB) : []),
    [safeDraft.mode, safeDraft.parsedB]
  );

  useEffect(() => {
    if (persistMode !== "create") return;
    try {
      const backup = window.localStorage.getItem(draftBackupKey);
      if (!backup) return;
      const parsed = JSON.parse(backup) as ReportRecord;
      const recovered = sanitizeReportDraft(parsed);
      setDraft(recovered);
      setSavedMessage("Brouillon local restaure.");
    } catch {
      // Keep silent on malformed local cache.
    }
  }, [draftBackupKey, persistMode]);

  useEffect(() => {
    if (persistMode !== "create") return;
    try {
      window.localStorage.setItem(draftBackupKey, JSON.stringify(safeDraft));
    } catch {
      // Keep silent when storage quota is full.
    }
  }, [draftBackupKey, persistMode, safeDraft]);

  function update(mutator: (current: ReportRecord) => ReportRecord) {
    setDraft((current) => sanitizeReportDraft(mutator(current)));
  }

  function looksLikeStructuredPayload(raw: string) {
    return raw.includes("===SECTION===") || /^\s*key\s*:/im.test(raw);
  }

  function applyGlobalDispatch() {
    if (!globalPaste.trim()) return;
    setDispatchMessage("");

    if (looksLikeStructuredPayload(globalPaste)) {
      const parsed = parseGptStructuredNarrative(globalPaste, { mode: safeDraft.mode });
      const injected = mapParsedSectionsToEditorialSections(parsed, safeDraft.editorialSections, safeDraft.mode);

      if (injected.blockingErrors.length > 0) {
        setDispatchMessage(`Import structuré bloqué: ${injected.blockingErrors[0]}`);
        return;
      }

      update((current) => ({
        ...current,
        editorialSections: injected.sections,
        editorialSource: {
          sections: applyStructuredSectionsToSource(
            current.editorialSource.sections,
            injected.sections,
            current.mode,
            { overwrite: true }
          )
        }
      }));
      setDispatchMessage(`Import structuré appliqué (${parsed.confidenceScore}/100).`);
      return;
    }

    update((current) => ({
      ...current,
      editorialSource: {
        sections: dispatchEditorialPaste(globalPaste, current.editorialSource.sections, current.mode)
      }
    }));
    setDispatchMessage("Dispatch narratif appliqué.");
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

  async function save() {
    setSaving(true);
    setSavedMessage("");
    try {
      const canUpdate = isEditMode || isPersisted;
      const endpoint = canUpdate ? `/api/reports/${safeDraft.id}` : "/api/reports";
      const method = canUpdate ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safeDraft)
      });

      if (!response.ok) {
        const serverMessage = await readResponseError(
          response,
          "Impossible d’enregistrer pour le moment."
        );
        const backupNotice = persistMode === "create" ? " Brouillon local conservé sur cet appareil." : "";
        setSavedMessage(`${serverMessage}${backupNotice}`);
        return;
      }

      const data = (await response.json()) as { report: ReportRecord };
      const safeReport = sanitizeReportDraft(data.report);
      setDraft(safeReport);
      setIsPersisted(true);

      if (!isEditMode && !canUpdate) {
        try {
          window.localStorage.removeItem(draftBackupKey);
        } catch {
          // Ignore local cache clean-up failures.
        }
      }

      setSavedMessage(isEditMode ? "Rapport mis à jour." : "Rapport enregistré.");
    } catch {
      const backupNotice = persistMode === "create" ? " Brouillon local conservé sur cet appareil." : "";
      setSavedMessage(`Impossible d’enregistrer pour le moment.${backupNotice}`);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!isPersisted || !safeDraft.id) {
      setSavedMessage("Enregistre d'abord le rapport pour publier.");
      return;
    }

    setBusyPublish(true);
    setSavedMessage("");
    const endpoint = safeDraft.share?.isPublished ? "unpublish" : "publish";

    try {
      const response = await fetch(`/api/reports/${safeDraft.id}/${endpoint}`, { method: "POST" });
      if (!response.ok) {
        const message = await readResponseError(response, "Action de publication indisponible.");
        setSavedMessage(message);
        return;
      }
      const data = (await response.json()) as { report: ReportRecord };
      const next = sanitizeReportDraft(data.report);
      setDraft(next);
      setSavedMessage(next.share?.isPublished ? "Version mobile publiée." : "Version mobile dépubliée.");
    } catch {
      setSavedMessage("Action de publication indisponible.");
    } finally {
      setBusyPublish(false);
    }
  }

  async function removeReport() {
    if (!isPersisted || !safeDraft.id) {
      setSavedMessage("Aucun rapport sauvegardé à supprimer.");
      return;
    }

    setBusyDelete(true);
    setSavedMessage("");
    try {
      const response = await fetch(`/api/reports/${safeDraft.id}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await readResponseError(response, "Suppression impossible.");
        setSavedMessage(message);
        return;
      }
      try {
        window.localStorage.removeItem(draftBackupKey);
      } catch {
        // Ignore local cache clean-up failures.
      }
      router.push("/dashboard");
    } catch {
      setSavedMessage("Suppression impossible.");
    } finally {
      setBusyDelete(false);
    }
  }

  async function openTechnicalPdfFromDraft() {
    setSavedMessage("");
    try {
      const response = await fetch("/api/reports/preview-pdf?kind=technical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safeDraft)
      });

      if (!response.ok) {
        setSavedMessage("Impossible de generer le PDF technique.");
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setSavedMessage("PDF technique genere.");
    } catch {
      setSavedMessage("Impossible de generer le PDF technique.");
    }
  }

  async function openEditorialPdfFromDraft() {
    setSavedMessage("");
    try {
      const response = await fetch("/api/reports/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safeDraft)
      });

      if (!response.ok) {
        setSavedMessage("Impossible de generer le PDF.");
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setSavedMessage("PDF genere.");
    } catch {
      setSavedMessage("Impossible de generer le PDF.");
    }
  }

  const analysisLabel = safeDraft.mode === "compatibility" ? "ANALYSE 2" : "ANALYSE 1";
  const isPublished = Boolean(safeDraft.share?.isPublished);
  const mobilePath = isPublished && safeDraft.share?.shareToken ? `/r/${safeDraft.share.shareToken}` : null;
  const publishLabel = isPublished ? "DEPUBLIER" : "PUBLIER";
  const canUseServerActions = isPersisted && Boolean(safeDraft.id);

  function renderCommandButtons() {
    return (
      <div className="button-row">
        <button className="button" type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "ENREGISTRER..." : "ENREGISTRER"}
        </button>
        <button className="button-secondary" type="button" onClick={() => void removeReport()} disabled={!canUseServerActions || busyDelete}>
          {busyDelete ? "SUPPRIMER..." : "SUPPRIMER"}
        </button>
        <button
          className="button-secondary"
          type="button"
          onClick={() => void togglePublish()}
          disabled={!canUseServerActions || busyPublish}
        >
          {busyPublish ? `${publishLabel}...` : publishLabel}
        </button>
        <button className="button-ghost" type="button" onClick={() => setTab("preview")}>
          APERCU
        </button>
        <button className="button-ghost" type="button" onClick={() => void openEditorialPdfFromDraft()}>
          {analysisLabel}
        </button>
        <button className="button-ghost" type="button" onClick={() => void openTechnicalPdfFromDraft()}>
          GPT
        </button>
        <button
          className="button-ghost"
          type="button"
          onClick={() => mobilePath ? window.open(mobilePath, "_blank", "noopener,noreferrer") : undefined}
          disabled={!mobilePath}
        >
          MOBILE
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="tabs">
          {previewTabs.map((item) => (
            <button
              key={item.key}
              className={`tab ${tab === item.key ? "is-active" : ""}`}
              onClick={() => setTab(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        {renderCommandButtons()}
        {savedMessage ? <p className="footer-note">{savedMessage}</p> : null}
      </div>

      {tab === "editor" ? (
        <>
          <div className="panel stack">
            <div className="page-header">
              <div className="section-kicker">Identité éditoriale</div>
              <div className="page-title">{safeDraft.meta.title}</div>
              <div className="page-subtitle">Une seule source éditoriale, deux rendus : PDF premium et lecture mobile.</div>
            </div>
            <div className="field-grid columns-2">
              <div className="field">
                <label>Titre</label>
                <input
                  className="input"
                  value={safeDraft.meta.title}
                  onChange={(event) =>
                    update((current) => ({ ...current, meta: { ...current.meta, title: event.target.value } }))
                  }
                />
              </div>
              <div className="field">
                <label>Sous-titre</label>
                <input
                  className="input"
                  value={safeDraft.meta.subtitle}
                  onChange={(event) =>
                    update((current) => ({ ...current, meta: { ...current.meta, subtitle: event.target.value } }))
                  }
                />
              </div>
            </div>
          </div>

          {mode === "solo" ? (
            <div className="panel stack">
              <div className="section-kicker">Profil</div>
              <div className="field-grid columns-4">
                <div className="field">
                  <label>Prénom</label>
                  <input
                    className="input"
                    value={safeDraft.subjects.solo?.firstName ?? ""}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        subjects: { ...current.subjects, solo: { ...current.subjects.solo!, firstName: event.target.value } }
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label>Date de naissance</label>
                  <EnhancedInput
                    type="date"
                    value={safeDraft.subjects.solo?.birthDate ?? ""}
                    onChange={(value) =>
                      update((current) => ({
                        ...current,
                        subjects: { ...current.subjects, solo: { ...current.subjects.solo!, birthDate: value } }
                      }))
                    }
                    placeholder="jj/mm/aaaa"
                  />
                </div>
                <div className="field">
                  <label>Heure</label>
                  <EnhancedInput
                    type="time"
                    value={safeDraft.subjects.solo?.birthTime ?? ""}
                    onChange={(value) =>
                      update((current) => ({
                        ...current,
                        subjects: { ...current.subjects, solo: { ...current.subjects.solo!, birthTime: value } }
                      }))
                    }
                    placeholder="00h00"
                  />
                </div>
                <div className="field">
                  <label>Lieu</label>
                  <EnhancedInput
                    type="place"
                    value={safeDraft.subjects.solo?.birthPlace ?? ""}
                    onChange={(value) =>
                      update((current) => ({
                        ...current,
                        subjects: { ...current.subjects, solo: { ...current.subjects.solo!, birthPlace: value } }
                      }))
                    }
                    placeholder="Ville ou code postal"
                  />
                </div>
              </div>
              <div className="stack">
                <div className="section-kicker">Repères automatiques du thème</div>
                <SignaturePointsStrip points={pointsA} />
              </div>
            </div>
          ) : (
            <div className="panel stack">
              <div className="section-kicker">Profils du duo</div>
              <div className="grid-2">
                {[
                  { key: "personA", label: "Profil A", points: pointsA },
                  { key: "personB", label: "Profil B", points: pointsB }
                ].map((person) => {
                  const subject = person.key === "personA" ? safeDraft.subjects.personA : safeDraft.subjects.personB;
                  return (
                    <div key={person.key} className="panel">
                      <div className="section-kicker">{person.label}</div>
                      <div className="field-grid columns-2">
                        <div className="field">
                          <label>Prénom</label>
                          <input
                            className="input"
                            value={subject?.firstName ?? ""}
                            onChange={(event) =>
                              update((current) => ({
                                ...current,
                                subjects: {
                                  ...current.subjects,
                                  [person.key]: { ...(current.subjects as any)[person.key], firstName: event.target.value }
                                }
                              }))
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Date</label>
                          <EnhancedInput
                            type="date"
                            value={subject?.birthDate ?? ""}
                            onChange={(value) =>
                              update((current) => ({
                                ...current,
                                subjects: {
                                  ...current.subjects,
                                  [person.key]: { ...(current.subjects as any)[person.key], birthDate: value }
                                }
                              }))
                            }
                            placeholder="jj/mm/aaaa"
                          />
                        </div>
                        <div className="field">
                          <label>Heure</label>
                          <EnhancedInput
                            type="time"
                            value={subject?.birthTime ?? ""}
                            onChange={(value) =>
                              update((current) => ({
                                ...current,
                                subjects: {
                                  ...current.subjects,
                                  [person.key]: { ...(current.subjects as any)[person.key], birthTime: value }
                                }
                              }))
                            }
                            placeholder="00h00"
                          />
                        </div>
                        <div className="field">
                          <label>Lieu</label>
                          <EnhancedInput
                            type="place"
                            value={subject?.birthPlace ?? ""}
                            onChange={(value) =>
                              update((current) => ({
                                ...current,
                                subjects: {
                                  ...current.subjects,
                                  [person.key]: { ...(current.subjects as any)[person.key], birthPlace: value }
                                }
                              }))
                            }
                            placeholder="Ville ou code postal"
                          />
                        </div>
                      </div>
                      <SignaturePointsStrip points={person.points} compact />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="panel stack">
            <div className="section-kicker">Import brut</div>
            <div className="field-grid columns-2">
              <div className="field">
                <label>{mode === "solo" ? "Bloc astrologique" : "Bloc astrologique A"}</label>
                <textarea
                  className="textarea"
                  value={safeDraft.rawInputA}
                  onChange={(event) => update((current) => ({ ...current, rawInputA: event.target.value }))}
                />
              </div>
              {mode === "compatibility" ? (
                <div className="field">
                  <label>Bloc astrologique B</label>
                  <textarea
                    className="textarea"
                    value={safeDraft.rawInputB ?? ""}
                    onChange={(event) => update((current) => ({ ...current, rawInputB: event.target.value }))}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <ParsedTables chart={safeDraft.parsedA} title={mode === "solo" ? "Données structurées" : "Données structurées — Profil A"} />
          {mode === "compatibility" && safeDraft.parsedB ? (
            <ParsedTables chart={safeDraft.parsedB} title="Données structurées — Profil B" />
          ) : null}

          <div className="panel stack">
            <div className="section-kicker">Collé global intelligent</div>
            <div className="field">
              <label>Texte complet à dispatcher dans la trame</label>
              <textarea
                className="textarea textarea--xl"
                value={globalPaste}
                onChange={(event) => setGlobalPaste(event.target.value)}
                placeholder="Colle ici le texte complet rédigé par ton GPT, avec ses titres et ses paragraphes."
              />
            </div>
            <div className="button-row">
              <button className="button-secondary" type="button" onClick={applyGlobalDispatch}>
                Dispatcher dans la trame
              </button>
            </div>
            {dispatchMessage ? <p className="muted-note">{dispatchMessage}</p> : null}
          </div>

          <div className="panel section-editor">
            <div className="section-kicker">Source éditoriale unique</div>
            {safeDraft.editorialSource.sections.map((section, index) => (
              <div key={section.id} className="editor-section">
                <h3>{section.title}</h3>
                <div className="editor-section__subtitle">{section.subtitle}</div>
                <div className="field">
                  <label>Accroche / intro</label>
                  <textarea
                    className="textarea"
                    value={section.intro ?? ""}
                    onChange={(event) =>
                      update((current) => {
                        const sections = [...current.editorialSource.sections];
                        sections[index] = { ...sections[index], intro: event.target.value };
                        return { ...current, editorialSource: { sections } };
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>Corps de section</label>
                  <textarea
                    className="textarea textarea--xl"
                    value={section.bodyBlocks.map((item) => item.text).join("\n\n")}
                    onChange={(event) =>
                      update((current) => {
                        const parts = event.target.value
                          .split(/\n{2,}/)
                          .map((part) => part.trim())
                          .filter(Boolean)
                          .map((text, blockIndex) => ({ id: `${section.id}_b${blockIndex + 1}`, text }));
                        const sections = [...current.editorialSource.sections];
                        sections[index] = { ...sections[index], bodyBlocks: parts };
                        return { ...current, editorialSource: { sections } };
                      })
                    }
                  />
                </div>
                <div className="field-grid columns-2">
                  <div className="field">
                    <label>Citation</label>
                    <textarea
                      className="textarea"
                      value={section.pullQuote ?? ""}
                      onChange={(event) =>
                        update((current) => {
                          const sections = [...current.editorialSource.sections];
                          sections[index] = { ...sections[index], pullQuote: event.target.value };
                          return { ...current, editorialSource: { sections } };
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Encadré signature</label>
                    <textarea
                      className="textarea"
                      value={section.signatureBox?.text ?? ""}
                      onChange={(event) =>
                        update((current) => {
                          const sections = [...current.editorialSource.sections];
                          sections[index] = {
                            ...sections[index],
                            signatureBox: {
                              label: sections[index].signatureBox?.label || "En une phrase",
                              text: event.target.value
                            }
                          };
                          return { ...current, editorialSource: { sections } };
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            {renderCommandButtons()}
            {savedMessage ? <p className="footer-note">{savedMessage}</p> : null}
          </div>
        </>
      ) : (
        <ReportPreview report={safeDraft} />
      )}

      {tab === "editor" ? (
        <button
          className="floating-save-button"
          type="button"
          onClick={() => void save()}
          disabled={saving}
          aria-label="Enregistrer la saisie"
        >
          {saving ? "ENREGISTRER..." : "ENREGISTRER"}
        </button>
      ) : null}
    </div>
  );
}
