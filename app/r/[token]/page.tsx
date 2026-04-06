import { notFound } from "next/navigation";
import { getReportByShareToken } from "@/lib/storage";
import { MobileReadingView } from "@/components/mobile-reading-view";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getReportByShareToken(token);
  if (!report) notFound();
  return (
    <main className="page">
      <div className="shell">
        <MobileReadingView
          report={report}
          options={{
            analysisOnly: false,
            showShareActions: false
          }}
        />
      </div>
    </main>
  );
}
