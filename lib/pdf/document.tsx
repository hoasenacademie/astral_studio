import path from "path";
import { Document } from "@react-pdf/renderer";
import { ReportRecord } from "@/lib/types";
import { resolveEditorialLayoutPlan } from "@/lib/editorial-layout-plan";
import { imageSourceFromAbsolute, imageSourceFromPublicPath } from "@/lib/pdf/image-source";
import { sanitizePdfText } from "@/lib/pdf/text-utils";
import { PdfCoverPage } from "@/components/pdf/pdf-cover-page";
import { PdfSignaturePage } from "@/components/pdf/pdf-signature-page";
import { PdfEditorialPage } from "@/components/pdf/pdf-editorial-page";
import { PdfQuotePage } from "@/components/pdf/pdf-quote-page";
import { PdfConclusionPage } from "@/components/pdf/pdf-conclusion-page";

const COVER = path.join(process.cwd(), "public", "pdf", "cover.png");

function safeSectionText(value?: string | null): string {
  const source = sanitizePdfText(value);
  if (!source) return "";

  if (
    source.includes("===SECTION===") ||
    source.includes("===END===") ||
    source.includes("key:") ||
    source.includes("title:") ||
    source.includes("subtitle:") ||
    source.includes("intro:") ||
    source.includes("body:") ||
    source.includes("quote:") ||
    source.includes("signature:")
  ) {
    return "";
  }

  return source;
}

export function StudioPdfDocumentPages({ report }: { report: ReportRecord }) {
  const plan = resolveEditorialLayoutPlan(report);
  const coverImage = imageSourceFromAbsolute(COVER);

  return (
    <>
      {plan.map((page) => {
        if (page.kind === "cover_page") {
          const safePage = {
            ...page,
            title: safeSectionText(page.title),
            subtitle: safeSectionText(page.subtitle),
            subjectLabel: safeSectionText(page.subjectLabel),
            brandLabel: safeSectionText(page.brandLabel)
          };
          return <PdfCoverPage key={page.key} page={safePage} coverImage={coverImage} />;
        }
        if (page.kind === "signature_page") {
          const safePage = {
            ...page,
            title: safeSectionText(page.title),
            subtitle: safeSectionText(page.subtitle),
            columns: page.columns.map((column) => ({
              ...column,
              label: safeSectionText(column.label),
              points: column.points.map((point) => ({
                ...point,
                sign: safeSectionText(point.sign),
                asset: point.asset
                  ? {
                      ...point.asset,
                      label: safeSectionText(point.asset.label)
                    }
                  : point.asset
              }))
            }))
          };
          return <PdfSignaturePage key={page.key} page={safePage} imageResolver={imageSourceFromPublicPath} />;
        }
        if (page.kind === "editorial_page") {
          const safePage = {
            ...page,
            introParagraphs: page.introParagraphs.map((text) => safeSectionText(text)).filter(Boolean),
            bodyParagraphs: page.bodyParagraphs.map((text) => safeSectionText(text)).filter(Boolean),
            inlineQuote: safeSectionText(page.inlineQuote),
            signatureBox: page.signatureBox
              ? {
                  ...page.signatureBox,
                  text: safeSectionText(page.signatureBox.text)
                }
              : null
          };
          return <PdfEditorialPage key={page.key} page={safePage} />;
        }
        if (page.kind === "quote_page") {
          const safeText = safeSectionText(page.text);
          if (!safeText) return null;
          return <PdfQuotePage key={page.key} page={{ ...page, text: safeText }} />;
        }
        const safeConclusion = {
          ...page,
          paragraphs: page.paragraphs.map((text) => safeSectionText(text)).filter(Boolean),
          finalLine: safeSectionText(page.finalLine) || "Votre trajectoire reste ouverte, precise et vivante.",
          signatureReminderLines: page.signatureReminderLines.map((text) => safeSectionText(text)).filter(Boolean)
        };
        return <PdfConclusionPage key={page.key} page={safeConclusion} />;
      })}
    </>
  );
}

export function StudioPdfDocument({ report }: { report: ReportRecord }) {
  return (
    <Document title={report.meta.title}>
      <StudioPdfDocumentPages report={report} />
    </Document>
  );
}
