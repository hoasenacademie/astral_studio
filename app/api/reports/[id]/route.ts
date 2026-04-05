import { NextResponse } from "next/server";
import { deleteReport, getReport, saveReport } from "@/lib/storage";
import { sanitizeReportDraft } from "@/lib/report-builder";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const report = await getReport(id); if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 }); return NextResponse.json({ report: sanitizeReportDraft(report) }); }
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const body = await request.json(); const report = sanitizeReportDraft({ ...body, id }); await saveReport(report); return NextResponse.json({ report }); }
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; await deleteReport(id); return NextResponse.json({ ok: true }); }
