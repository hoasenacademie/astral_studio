import Link from "next/link";
export function Topbar() {
  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <div className="brand"><span className="brand__eyebrow">Studio éditorial</span><span className="brand__name">Astral Studio</span></div>
        <nav className="nav">
          <Link href="/">Accueil</Link><Link href="/dashboard">Dashboard</Link><Link href="/reports/new">1 thème</Link><Link href="/compatibility/new">2 thèmes</Link>
        </nav>
      </div>
    </header>
  );
}
