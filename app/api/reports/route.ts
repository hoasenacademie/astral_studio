import { NextResponse } from "next/server";
import { listReports, saveReport } from "@/lib/storage";
import { sanitizeReportDraft } from "@/lib/report-builder";
export const runtime = "nodejs";

export async function GET() {
  try {
    const reports = await listReports();
    return NextResponse.json({
      reports: reports.map((report) => sanitizeReportDraft(report))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de lister les rapports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = sanitizeReportDraft(body);
    const saved = await saveReport(report);
    return NextResponse.json({ report: sanitizeReportDraft(saved) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'enregistrer le rapport.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
