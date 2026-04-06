"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReportRecord } from "@/lib/types";
import {
  readLocalReportCache,
  removeLocalReport
} from "@/lib/local-report-cache";

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
  const [serverIds] = useState<Set<string>>(() => new Set(initialReports.map((report) => report.id)));

  const hasReports = useMemo(() => reports.length > 0, [reports.length]);
  const localOnlyReports = useMemo(
    () => reports.filter((report) => !serverIds.has(report.id)).length,
    [reports, serverIds]
  );

  useEffect(() => {
    const localReports = readLocalReportCache();
    if (!localReports.length) return;

    const byId = new Map<string, ReportRecord>();
    for (const report of initialReports) byId.set(report.id, report);
    for (const report of localReports) {
      if (!byId.has(report.id)) byId.set(report.id, report);
    }

    const merged = [...byId.values()].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    setReports(merged);
  }, [initialReports]);

  async function removeReport(reportId: string) {
    const confirmed = window.confirm("Supprimer cette analyse de l'historique ?");
    if (!confirmed) return;

    const isServerBacked = serverIds.has(reportId);
    setStatus("");
    setBusyDeleteId(reportId);
    const previous = reports;
    setReports((current) => current.filter((report) => report.id !== reportId));

    if (!isServerBacked) {
      removeLocalReport(reportId);
      setStatus("Analyse locale supprimee.");
      setBusyDeleteId(null);
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("delete_failed");
      }
      removeLocalReport(reportId);
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
      {localOnlyReports > 0 ? (
        <p className="muted-note">
          {localOnlyReports} analyse(s) locale(s) detectee(s). Clique ENREGISTRER pour les resynchroniser au serveur.
        </p>
      ) : null}
      {reports.map((report) => (
        <article key={report.id} className="card report-history-card">
          <Link
            className="report-history-card__main"
            href={
              serverIds.has(report.id)
                ? `/reports/${report.id}`
                : report.mode === "solo"
                  ? `/reports/new?restore=${report.id}`
                  : `/compatibility/new?restore=${report.id}`
            }
          >
            <div className="report-meta">
              <span>{formatModeLabel(report.mode)}</span>
              <span>{new Date(report.updatedAt).toLocaleString("fr-FR")}</span>
            </div>
            <h3>{report.meta.title}</h3>
            <p>{report.meta.subtitle}</p>
          </Link>

          <div className="report-history-card__actions">
            <Link
              className="button-ghost"
              href={
                serverIds.has(report.id)
                  ? `/reports/${report.id}`
                  : report.mode === "solo"
                    ? `/reports/new?restore=${report.id}`
                    : `/compatibility/new?restore=${report.id}`
              }
            >
              Voir
            </Link>
            <Link
              className="button-secondary"
              href={
                serverIds.has(report.id)
                  ? `/reports/${report.id}/edit`
                  : report.mode === "solo"
                    ? `/reports/new?restore=${report.id}`
                    : `/compatibility/new?restore=${report.id}`
              }
            >
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
