import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportByShareToken, hasPersistentStorage } from "@/lib/storage";
import { MobileReadingView } from "@/components/mobile-reading-view";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getReportByShareToken(token);
  if (!report) {
    if (!hasPersistentStorage()) {
      return (
        <main className="page">
          <div className="shell empty">
            Lien mobile indisponible: stockage persistant non configure sur ce deploiement.
            <br />
            Configure DATABASE_URL ou POSTGRES_URL puis republie l'analyse.
            <br />
            <Link href="/dashboard">Retour au dashboard</Link>
          </div>
        </main>
      );
    }
    notFound();
  }
  return (
    <main className="page">
      <div className="shell">
        <MobileReadingView
          report={report}
          options={{
            analysisOnly: false,
            showShareActions: false,
            showPdfDownloadAtEnd: true,
            forceToc: true,
            showTocFab: true
          }}
        />
      </div>
    </main>
  );
}
