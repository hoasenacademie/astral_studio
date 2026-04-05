import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/storage";
import { ReportPreview } from "@/components/report-preview";
import { ReportShareActions } from "@/components/report-share-actions";
import { ReportDetailActions } from "@/components/report-detail-actions";
export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  return (
    <main className="page">
      <div className="shell stack">
        <div className="button-row">
          <Link className="button-secondary" href="/dashboard">Retour au dashboard</Link>
          <Link className="button-ghost" href={report.mode === "solo" ? "/reports/new" : "/compatibility/new"}>Nouveau rapport</Link>
        </div>
        <ReportShareActions
          reportId={report.id}
          mode={report.mode}
          initialPublished={Boolean(report.share?.isPublished)}
          initialToken={report.share?.shareToken ?? null}
        />
        <ReportDetailActions reportId={report.id} />
        <ReportPreview report={report} />
      </div>
    </main>
  );
}
