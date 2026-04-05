import { NextResponse } from "next/server";
import { listReports, saveReport } from "@/lib/storage";
import { sanitizeReportDraft } from "@/lib/report-builder";
export const runtime = "nodejs";
export async function GET() { const reports = await listReports(); return NextResponse.json({ reports: reports.map((report) => sanitizeReportDraft(report)) }); }
export async function POST(request: Request) { const body = await request.json(); const report = sanitizeReportDraft(body); await saveReport(report); return NextResponse.json({ report }); }
