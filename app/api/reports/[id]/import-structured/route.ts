import { NextResponse } from "next/server";
import { parseGptStructuredNarrative } from "@/lib/gpt-parser/parser";
import { mapParsedSectionsToEditorialSections } from "@/lib/reports/injection";
import { applyStructuredSectionsToSource } from "@/lib/editorial/structured-sections";
import { sanitizeReportDraft } from "@/lib/report-builder";
import { getReport, saveReport } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  const safeReport = sanitizeReportDraft(report);

  const body = await request.json();
  const raw = typeof body.raw === "string" ? body.raw : "";

  const parsed = parseGptStructuredNarrative(raw, { mode: safeReport.mode });
  const injected = mapParsedSectionsToEditorialSections(parsed, safeReport.editorialSections, safeReport.mode);

  if (injected.blockingErrors.length > 0) {
    return NextResponse.json(
      {
        error: "Import blocked",
        blockingErrors: injected.blockingErrors,
        parsed
      },
      { status: 422 }
    );
  }

  const updatedReport = sanitizeReportDraft({
    ...safeReport,
    editorialSections: injected.sections,
    editorialSource: {
      sections: applyStructuredSectionsToSource(
        safeReport.editorialSource.sections,
        injected.sections,
        safeReport.mode,
        { overwrite: true }
      )
    },
    updatedAt: new Date().toISOString()
  });

  await saveReport(updatedReport);

  return NextResponse.json({
    report: updatedReport,
    parsed
  });
}
