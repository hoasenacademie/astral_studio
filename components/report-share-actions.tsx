"use client";

import { useMemo, useState } from "react";

export function ReportShareActions({
  reportId,
  mode,
  initialPublished,
  initialToken
}: {
  reportId: string;
  mode: "solo" | "compatibility";
  initialPublished: boolean;
  initialToken: string | null;
}) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [shareToken, setShareToken] = useState<string | null>(initialToken);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const technicalLabel = mode === "compatibility" ? "pdf tech. 2" : "pdf tech. 1";

  const shareUrl = useMemo(() => {
    if (!shareToken || typeof window === "undefined") return "";
    return `${window.location.origin}/r/${shareToken}`;
  }, [shareToken]);

  async function publish() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`/api/reports/${reportId}/publish`, { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus(data.error ?? "Publication impossible.");
        return;
      }
      const data = await response.json();
      setIsPublished(Boolean(data.report?.share?.isPublished));
      setShareToken(data.report?.share?.shareToken ?? null);
      setStatus("Version mobile publiee.");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`/api/reports/${reportId}/unpublish`, { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus(data.error ?? "Depublication impossible.");
        return;
      }
      const data = await response.json();
      setIsPublished(Boolean(data.report?.share?.isPublished));
      setShareToken(data.report?.share?.shareToken ?? null);
      setStatus("Version mobile depubliee.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    window.alert("Lien mobile copie.");
  }

  return (
    <div className="panel stack">
      <div className="section-kicker">Livrables</div>
      <div className="button-row">
        <a className="button" href={`/api/reports/${reportId}/pdf`} target="_blank" rel="noreferrer">
          Telecharger le PDF
        </a>
        <a
          className="button-secondary"
          href={`/api/reports/${reportId}/pdf?kind=technical`}
          target="_blank"
          rel="noreferrer"
        >
          {technicalLabel}
        </a>
        {!isPublished ? (
          <button className="button-secondary" type="button" onClick={publish} disabled={busy}>
            {busy ? "Publication..." : "Publier la version mobile"}
          </button>
        ) : (
          <>
            <button className="button-secondary" type="button" onClick={copyLink}>
              Copier le lien mobile
            </button>
            {shareUrl ? (
              <a className="button-secondary" href={shareUrl} target="_blank" rel="noreferrer">
                Ouvrir le lien client
              </a>
            ) : null}
            <button className="button-ghost" type="button" onClick={unpublish} disabled={busy}>
              {busy ? "Mise a jour..." : "Depublier"}
            </button>
          </>
        )}
      </div>
      <p className="muted-note">
        Le PDF editorial se partage comme document final. Le PDF technique est reserve au workflow interne GPT.
      </p>
      {status ? <p className="muted-note">{status}</p> : null}
    </div>
  );
}
