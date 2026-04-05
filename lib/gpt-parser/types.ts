import type { CanonicalSectionKey } from "@/lib/editorial/section-schema";

export type BlockKind = "intro" | "body" | "quote" | "signature";

export type ParsedSection = {
  key: CanonicalSectionKey;
  title: string;
  subtitle?: string;
  intro?: string;
  body?: string;
  quote?: string;
  signature?: string;
  sourceSlice?: string;
  confidence: number;
  warnings: string[];
};

export type ParserWarning = {
  code: string;
  message: string;
  sectionKey?: CanonicalSectionKey;
};

export type ParserError = {
  code: string;
  message: string;
  sectionKey?: CanonicalSectionKey;
};

export type ParsePreviewRow = {
  key: CanonicalSectionKey;
  title: string;
  found: boolean;
  introLength: number;
  bodyLength: number;
  quoteLength: number;
  signatureLength: number;
  confidence: number;
  warnings: string[];
};

export type ParserResult = {
  sections: ParsedSection[];
  warnings: ParserWarning[];
  errors: ParserError[];
  confidenceScore: number;
  normalizedInput: string;
};

export type SectionTemplate = {
  key: CanonicalSectionKey;
  title: string;
  subtitle?: string;
  aliases: string[];
  requiredBlocks: BlockKind[];
  optionalBlocks?: BlockKind[];
  quoteOnly?: boolean;
  introOnly?: boolean;
};