"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Topbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/r/")) return null;

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <div className="brand">
          <span className="brand__eyebrow">Studio editorial</span>
          <span className="brand__name">Astral Studio</span>
        </div>
        <nav className="nav">
          <Link href="/">Accueil</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/reports/new">1 theme</Link>
          <Link href="/compatibility/new">2 themes</Link>
        </nav>
      </div>
    </header>
  );
}
