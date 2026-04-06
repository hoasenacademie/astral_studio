import { NextResponse } from "next/server";
import { deleteReport, getReport, saveReport } from "@/lib/storage";
import { sanitizeReportDraft } from "@/lib/report-builder";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await getReport(id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({ report: sanitizeReportDraft(report) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de charger le rapport.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const report = sanitizeReportDraft({ ...body, id });
    const saved = await saveReport(report);
    return NextResponse.json({ report: sanitizeReportDraft(saved) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de sauvegarder ce rapport.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteReport(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de supprimer ce rapport.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
