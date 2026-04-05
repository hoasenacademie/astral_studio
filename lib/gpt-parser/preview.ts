import type { ParsePreviewRow, ParserResult } from "./types";

function lengthOf(value?: string): number {
  return (value ?? "").trim().length;
}

export function buildParsePreview(result: ParserResult): ParsePreviewRow[] {
  return result.sections.map((section) => ({
    key: section.key,
    title: section.title,
    found: section.confidence > 0,
    introLength: lengthOf(section.intro),
    bodyLength: lengthOf(section.body),
    quoteLength: lengthOf(section.quote),
    signatureLength: lengthOf(section.signature),
    confidence: section.confidence,
    warnings: section.warnings
  }));
}

