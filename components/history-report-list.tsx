"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReportRecord } from "@/lib/types";

type HistoryReportListProps = {
  initialReports: ReportRecord[];
};

function formatModeLabel(mode: ReportRecord["mode"]) {
  return mode === "solo" ? "1 theme" : "2 themes";
}

export function HistoryReportList({ initialReports }: HistoryReportListProps) {
  const router = useRouter();
  const [reports, setReports] = useState<ReportRecord[]>(initialReports);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const hasReports = useMemo(() => reports.length > 0, [reports.length]);

  async function removeReport(reportId: string) {
    const confirmed = window.confirm("Supprimer cette analyse de l'historique ?");
    if (!confirmed) return;

    setStatus("");
    setBusyDeleteId(reportId);
    const previous = reports;
    setReports((current) => current.filter((report) => report.id !== reportId));

    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("delete_failed");
      }
      setStatus("Analyse supprimee.");
      router.refresh();
    } catch {
      setReports(previous);
      setStatus("Suppression impossible pour le moment.");
    } finally {
      setBusyDeleteId(null);
    }
  }

  if (!hasReports) {
    return <div className="empty">Aucun rapport enregistre pour le moment.</div>;
  }

  return (
    <div className="report-list">
      {reports.map((report) => (
        <article key={report.id} className="card report-history-card">
          <Link className="report-history-card__main" href={`/reports/${report.id}`}>
            <div className="report-meta">
              <span>{formatModeLabel(report.mode)}</span>
              <span>{new Date(report.updatedAt).toLocaleString("fr-FR")}</span>
            </div>
            <h3>{report.meta.title}</h3>
            <p>{report.meta.subtitle}</p>
          </Link>

          <div className="report-history-card__actions">
            <Link className="button-ghost" href={`/reports/${report.id}`}>
              Voir
            </Link>
            <Link className="button-secondary" href={`/reports/${report.id}/edit`}>
              Modifier
            </Link>
            <button
              className="button-ghost"
              type="button"
              onClick={() => void removeReport(report.id)}
              disabled={busyDeleteId === report.id}
            >
              {busyDeleteId === report.id ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </article>
      ))}

      {status ? <p className="muted-note">{status}</p> : null}
    </div>
  );
}
