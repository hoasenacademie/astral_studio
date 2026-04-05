import { NextResponse } from "next/server";
import { parseGptStructuredNarrative } from "@/lib/gpt-parser/parser";
import { buildParsePreview } from "@/lib/gpt-parser/preview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const raw = typeof body.raw === "string" ? body.raw : "";
  const mode = body.mode === "compatibility" ? "compatibility" : body.mode === "solo" ? "solo" : undefined;

  const parsed = parseGptStructuredNarrative(raw, mode ? { mode } : undefined);
  const preview = buildParsePreview(parsed);

  return NextResponse.json({
    parsed,
    preview,
    canImport: parsed.errors.length === 0 && parsed.confidenceScore >= 45
  });
}
