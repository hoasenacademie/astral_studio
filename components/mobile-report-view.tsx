import { MobileReadingView } from "@/components/mobile-reading-view";
import { StudioReportDraft } from "@/lib/report-builder";

export function MobileReportView({ report }: { report: StudioReportDraft }) {
  return <MobileReadingView report={report} />;
}

