import { ReportEditor } from "@/components/report-editor";
export default function NewReportPage() {
  return (
    <main className="page">
      <div className="shell stack">
        <header className="page-header"><div className="section-kicker">1 thème</div><div className="page-title">Portrait éditorial</div><div className="page-subtitle">Saisis un portrait premium, avec vignette du signe, PDF paginé et lecture mobile.</div></header>
        <ReportEditor mode="solo" />
      </div>
    </main>
  );
}
