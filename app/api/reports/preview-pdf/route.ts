import { NextResponse } from "next/server";
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { sanitizeReportDraft } from "@/lib/report-builder";
import { StudioPdfDocumentPages } from "@/lib/pdf-document";
import { TechnicalPromptPdfDocumentPages } from "@/lib/pdf/technical-document";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const report = sanitizeReportDraft(body);
  const url = new URL(request.url);
  const isTechnical = url.searchParams.get("kind") === "technical";

  const buffer = isTechnical
    ? await renderToBuffer(
        React.createElement(
          Document,
          { title: `${report.meta.title} - brief technique` },
          React.createElement(TechnicalPromptPdfDocumentPages, { report })
        )
      )
    : await renderToBuffer(
        React.createElement(
          Document,
          { title: `${report.meta.title} - preview` },
          React.createElement(StudioPdfDocumentPages, { report })
        )
      );

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": isTechnical
        ? 'inline; filename="preview-technique.pdf"'
        : 'inline; filename="preview.pdf"',
      "Cache-Control": "no-store"
    }
  });
}
