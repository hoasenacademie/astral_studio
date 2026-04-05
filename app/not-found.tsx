import Link from "next/link";
export default function NotFound() {
  return <main className="page"><div className="shell empty">Rapport introuvable. <Link href="/dashboard">Retour au dashboard</Link></div></main>;
}
