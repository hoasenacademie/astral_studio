import { ReportEditor } from "@/components/report-editor";
export default function NewCompatibilityPage() {
  return (
    <main className="page">
      <div className="shell stack">
        <header className="page-header"><div className="section-kicker">2 thèmes</div><div className="page-title">Portrait du lien</div><div className="page-subtitle">Saisis une compatibilité éditoriale haut de gamme, pensée comme un portrait du lien.</div></header>
        <ReportEditor mode="compatibility" />
      </div>
    </main>
  );
}
