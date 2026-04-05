import Link from "next/link";
import { listReports } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const reports = await listReports();
  return (
    <main className="hero">
      <div className="shell hero__layout">
        <section className="hero__card">
          <div className="hero__eyebrow">Une seule source éditoriale · deux rendus</div>
          <h1>Astral Studio Premium</h1>
          <p>Un studio mono-utilisatrice pour agréger des données astrologiques, saisir un portrait 1 thème ou 2 thèmes, puis produire un rendu PDF éditorial et une expérience mobile verticale sans réduire le PDF.</p>
          <div className="button-row">
            <Link className="button" href="/reports/new">Créer un portrait 1 thème</Link>
            <Link className="button-secondary" href="/compatibility/new">Créer une compatibilité</Link>
            <Link className="button-ghost" href="/dashboard">Voir l’historique</Link>
          </div>
        </section>
        <section className="panel stack">
          <div className="section-kicker">Collection active</div>
          <div className="page-title" style={{ fontSize: "42px" }}>{reports.length} rapport{reports.length > 1 ? "s" : ""}</div>
          <p className="lead">Le système respecte une logique de source éditoriale unique, avec un rendu PDF paginé et un rendu mobile recomposé en écrans courts, cartes citations et synthèses respirées.</p>
          <div className="badges"><span className="badge">PDF premium</span><span className="badge">Mobile reading</span><span className="badge">Signe en vignette</span><span className="badge">Sans analyse automatique</span></div>
        </section>
      </div>
    </main>
  );
}
