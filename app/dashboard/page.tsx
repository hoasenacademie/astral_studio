import Link from "next/link";
import { HistoryReportList } from "@/components/history-report-list";
import { listReports } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const reports = await listReports();

  return (
    <main className="page">
      <div className="shell stack">
        <header className="page-header">
          <div className="section-kicker">Historique</div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            Historique local des rapports enregistres, pret a etre exporte en PDF.
          </div>
        </header>

        <div className="button-row">
          <Link className="button" href="/reports/new">
            Nouveau portrait 1 theme
          </Link>
          <Link className="button-secondary" href="/compatibility/new">
            Nouvelle compatibilite
          </Link>
        </div>

        <HistoryReportList initialReports={reports} />
      </div>
    </main>
  );
}
