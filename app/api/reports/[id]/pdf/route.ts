import { NextResponse } from "next/server";
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { StudioPdfDocumentPages } from "@/lib/pdf-document";
import {
  TechnicalPromptPdfDocumentPages,
  technicalPdfFilename
} from "@/lib/pdf/technical-document";
import { sanitizeReportDraft } from "@/lib/report-builder";
import { getReport } from "@/lib/storage";

export const runtime = "nodejs";

function editorialFilename(reportTitle: string) {
  const safeTitle = reportTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${safeTitle || "rapport"}.pdf`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stored = await getReport(id);
  if (!stored) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const report = sanitizeReportDraft(stored);
  const url = new URL(request.url);
  const isPreview = url.searchParams.get("preview") === "1";
  const isTechnical = url.searchParams.get("kind") === "technical";

  const buffer = isTechnical
    ? await renderToBuffer(
        React.createElement(
          Document,
          { title: `${report.meta.title} - Brief technique` },
          React.createElement(TechnicalPromptPdfDocumentPages, { report })
        )
      )
    : await renderToBuffer(
        React.createElement(
          Document,
          { title: report.meta.title },
          React.createElement(StudioPdfDocumentPages, { report })
        )
      );

  const filename = isTechnical
    ? technicalPdfFilename(report)
    : editorialFilename(report.meta.title);

  const disposition = isPreview
    ? `inline; filename="${filename}"`
    : `attachment; filename="${filename}"`;

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition
    }
  });
}
