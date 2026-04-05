import { NextResponse } from "next/server";
import { unpublishReport } from "@/lib/storage";
export const runtime = "nodejs";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const report = await unpublishReport(id); if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 }); return NextResponse.json({ report }); }
