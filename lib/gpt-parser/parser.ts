import {
  getEditorialSectionSchema,
  resolveCanonicalSectionKey,
  type CanonicalSchemaMode,
  type CanonicalSectionKey
} from "@/lib/editorial/section-schema";
import type { ParsedSection, ParserError, ParserResult, ParserWarning } from "./types";

type NarrativeHintMode = "solo" | "compatibility" | "unknown";

type MachineField = "intro" | "body" | "quote" | "signature";

const FIELD_NAMES: MachineField[] = ["intro", "body", "quote", "signature"];

type LooseSectionBucket = {
  heading: string;
  lines: string[];
};

type ParseNarrativeOptions = {
  mode?: CanonicalSchemaMode;
};

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSections(raw: string): string[] {
  const source = raw.replace(/\r/g, "").trim();
  if (!source) return [];

  if (source.includes("===SECTION===")) {
    return source
      .split("===SECTION===")
      .map((slice) => slice.replace("===END===", "").trim())
      .filter(Boolean);
  }

  return [source];
}

function splitParagraphs(input: string): string[] {
  return input
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function cleanHeadingCandidate(input: string): string {
  return input
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d{1,2}[\).\-\s]+/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/\s*:\s*$/, "")
    .trim();
}

function tokenSet(input: string): Set<string> {
  return new Set(
    normalize(input)
      .split(" ")
      .filter((token) => token.length >= 3)
  );
}

function overlapScore(left: string, right: string, unit: number): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (!leftTokens.size || !rightTokens.size) return 0;

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }
  return overlap * unit;
}

function scoreHeadingAgainstTemplate(heading: string, template: { key: CanonicalSectionKey; title: string; subtitle?: string; quoteOnly?: boolean }): number {
  const normalizedHeading = normalize(heading);
  const normalizedTitle = normalize(template.title);
  const normalizedSubtitle = normalize(template.subtitle ?? "");
  const normalizedKey = normalize(template.key.replace(/_/g, " "));

  let score = 0;
  if (normalizedHeading === normalizedTitle) score = Math.max(score, 130);
  if (normalizedSubtitle && normalizedHeading === normalizedSubtitle) score = Math.max(score, 110);
  if (normalizedHeading === normalizedKey) score = Math.max(score, 120);

  if (normalizedTitle.includes(normalizedHeading) || normalizedHeading.includes(normalizedTitle)) {
    score = Math.max(score, 95);
  }
  if (normalizedSubtitle && (normalizedSubtitle.includes(normalizedHeading) || normalizedHeading.includes(normalizedSubtitle))) {
    score = Math.max(score, 82);
  }
  if (normalizedKey.includes(normalizedHeading) || normalizedHeading.includes(normalizedKey)) {
    score = Math.max(score, 90);
  }

  score += overlapScore(heading, template.title, 14);
  score += overlapScore(heading, template.subtitle ?? "", 10);
  score += overlapScore(heading, template.key.replace(/_/g, " "), 8);

  if (template.quoteOnly && /(quote|citation|phrase)/i.test(heading)) score += 12;
  return score;
}

function detectSectionKeyFromHeading(
  heading: string,
  schema: ReturnType<typeof getEditorialSectionSchema>
): CanonicalSectionKey | null {
  const cleaned = cleanHeadingCandidate(heading);
  if (!cleaned) return null;

  const scored = schema.map((template) => ({
    key: template.key,
    score: scoreHeadingAgainstTemplate(cleaned, template)
  })).sort((left, right) => right.score - left.score);

  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < 46) return null;
  if (second && best.score < 96 && best.score - second.score < 10) return null;
  return best.key;
}

function extractQuoteFallback(paragraphs: string[]): string {
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean).length;
    if (/[«»"”“]/.test(paragraph) && words >= 4 && words <= 36) return paragraph;
  }
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean).length;
    if (words >= 8 && words <= 26) return paragraph;
  }
  return "";
}

function parseLooseNarrative(rawInput: string, mode: CanonicalSchemaMode): ParserResult {
  const schema = getEditorialSectionSchema(mode);
  const lines = rawInput.replace(/\r/g, "").split("\n");
  const sectionBuckets = new Map<CanonicalSectionKey, LooseSectionBucket>();
  const leadingLines: string[] = [];
  let currentKey: CanonicalSectionKey | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (currentKey) {
        const bucket = sectionBuckets.get(currentKey);
        if (bucket) bucket.lines.push("");
      } else if (leadingLines.length) {
        leadingLines.push("");
      }
      continue;
    }

    const detectedKey = detectSectionKeyFromHeading(line, schema);
    if (detectedKey) {
      currentKey = detectedKey;
      if (!sectionBuckets.has(detectedKey)) {
        sectionBuckets.set(detectedKey, { heading: cleanHeadingCandidate(line), lines: [] });
      }
      continue;
    }

    if (!currentKey) {
      leadingLines.push(line);
      continue;
    }

    const bucket = sectionBuckets.get(currentKey);
    if (bucket) bucket.lines.push(line);
  }

  if (leadingLines.length > 0) {
    const preamble = sectionBuckets.get("preamble") ?? { heading: "Avant de commencer", lines: [] };
    preamble.lines = [...leadingLines, ...preamble.lines];
    sectionBuckets.set("preamble", preamble);
  }

  const sections: ParsedSection[] = [];
  const warnings: ParserWarning[] = [];
  const errors: ParserError[] = [];
  let matchedSections = 0;

  for (const template of schema) {
    const bucket = sectionBuckets.get(template.key);
    const sourceSlice = bucket?.lines.join("\n").trim() ?? "";
    const introFromMachine = extractMachineField(sourceSlice, "intro");
    const bodyFromMachine = extractMachineField(sourceSlice, "body");
    const quoteFromMachine = extractMachineField(sourceSlice, "quote");
    const signatureFromMachine = extractMachineField(sourceSlice, "signature");

    const paragraphs = splitParagraphs(sourceSlice);
    const sectionWarnings: string[] = [];

    let intro = introFromMachine;
    let body = bodyFromMachine;
    let quote = quoteFromMachine;
    const signature = signatureFromMachine;

    if (!template.quoteOnly) {
      if (!intro && paragraphs.length > 0) intro = paragraphs[0];
      if (!body && paragraphs.length > 1) body = paragraphs.slice(1).join("\n\n");
      if (!body && !intro && paragraphs.length === 1) body = paragraphs[0];
    }

    if (!quote) {
      if (template.quoteOnly) quote = paragraphs[0] ?? "";
      else quote = extractQuoteFallback(paragraphs);
    }

    if (!sourceSlice) {
      warnings.push({
        code: "SECTION_MISSING",
        message: `Section absente: ${template.key}`,
        sectionKey: template.key
      });
    } else {
      matchedSections += 1;
    }

    if (!template.quoteOnly) {
      if (!intro) sectionWarnings.push("intro manquante");
      if (!body) sectionWarnings.push("body manquant");
    }
    if (!quote) sectionWarnings.push("quote manquante");

    const confidence =
      30 +
      (sourceSlice ? 20 : 0) +
      (intro ? 14 : 0) +
      (body ? 14 : 0) +
      (quote ? 12 : 0) +
      (signature ? 5 : 0) -
      sectionWarnings.length * 5;

    sections.push({
      key: template.key,
      title: bucket?.heading || template.title,
      subtitle: template.subtitle,
      intro,
      body,
      quote,
      signature,
      sourceSlice,
      confidence: Math.max(0, Math.min(100, confidence)),
      warnings: sectionWarnings
    });
  }

  if (matchedSections === 0 && rawInput.trim()) {
    errors.push({
      code: "NO_SECTION_MATCH",
      message: "Aucune section reconnue dans le texte colle."
    });
  }

  const confidenceScore =
    sections.length > 0
      ? Math.round(sections.reduce((sum, section) => sum + section.confidence, 0) / sections.length)
      : 0;

  return {
    sections,
    warnings,
    errors,
    confidenceScore,
    normalizedInput: rawInput
  };
}

function extractMachineKey(sectionText: string): string | null {
  const match = sectionText.match(/^\s*key:\s*([a-z0-9_:-]+)\s*$/im);
  return match ? match[1].trim() : null;
}

function extractMachineMeta(sectionText: string, meta: "title" | "subtitle"): string {
  const match = sectionText.match(new RegExp(`^\\s*${meta}:\\s*(.+)\\s*$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function normalizeLabel(input: string): string {
  return normalize(input).replace(/\s+/g, " ").trim();
}

function toMachineField(label: string): MachineField | null {
  const normalized = normalizeLabel(label).replace(/\s*:\s*$/, "");
  if (["intro", "accroche / intro", "accroche", "introduction"].includes(normalized)) return "intro";
  if (["body", "corps de section", "corps", "developpement", "developpement principal"].includes(normalized)) return "body";
  if (["quote", "citation", "citations"].includes(normalized)) return "quote";
  if (
    [
      "signature",
      "encadre signature",
      "encadre",
      "encadre signature astrologique",
      "carte synthese",
      "carte de synthese"
    ].includes(normalized)
  ) {
    return "signature";
  }
  return null;
}

function extractMachineField(sectionText: string, targetField: MachineField): string {
  const lines = sectionText.replace(/\r/g, "").split("\n");
  let activeField: MachineField | null = null;
  const bufferByField: Record<MachineField, string[]> = {
    intro: [],
    body: [],
    quote: [],
    signature: []
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const explicitField = toMachineField(trimmed);
    if (explicitField && /:\s*$/.test(trimmed)) {
      activeField = explicitField;
      continue;
    }

    const inlineMatch = trimmed.match(/^([^:]+)\s*:\s*(.+)$/);
    if (inlineMatch) {
      const inlineField = toMachineField(inlineMatch[1]);
      if (inlineField) {
        bufferByField[inlineField].push(inlineMatch[2].trim());
        activeField = null;
        continue;
      }
    }

    if (/^(key|title|subtitle)\s*:/i.test(trimmed)) {
      activeField = null;
      continue;
    }

    if (/^===END===/i.test(trimmed)) {
      activeField = null;
      continue;
    }

    if (activeField) {
      bufferByField[activeField].push(line);
    }
  }

  return bufferByField[targetField].join("\n").trim();
}

export function detectNarrativeMode(rawInput: string): {
  mode: NarrativeHintMode;
  soloScore: number;
  compatibilityScore: number;
} {
  const normalized = normalize(rawInput);
  const compatibilityMarkers = [
    "a deux",
    "duo",
    "entre vous",
    "ensemble",
    "le lien",
    "couple",
    "personne a",
    "personne b",
    "l un",
    "l autre",
    "votre relation"
  ];
  const soloMarkers = [
    "portrait intime",
    "ce que vous degagez",
    "votre signature interieure",
    "votre base interieure",
    "l art d etre pleinement vous",
    "vous meme",
    "personnelle"
  ];

  const compatibilityScore = compatibilityMarkers.reduce(
    (acc, marker) => (normalized.includes(marker) ? acc + 1 : acc),
    0
  );
  const soloScore = soloMarkers.reduce((acc, marker) => (normalized.includes(marker) ? acc + 1 : acc), 0);

  if (compatibilityScore >= soloScore + 2) return { mode: "compatibility", soloScore, compatibilityScore };
  if (soloScore >= compatibilityScore + 2) return { mode: "solo", soloScore, compatibilityScore };
  return { mode: "unknown", soloScore, compatibilityScore };
}

function resolveParserMode(rawInput: string, preferredMode?: CanonicalSchemaMode): CanonicalSchemaMode {
  if (preferredMode) return preferredMode;
  const hint = detectNarrativeMode(rawInput);
  return hint.mode === "compatibility" ? "compatibility" : "solo";
}

export function parseGptStructuredNarrative(
  rawInput: string,
  options?: ParseNarrativeOptions
): ParserResult {
  const normalizedInput = rawInput.replace(/\r/g, "").trim();
  const hasMachineFormat = normalizedInput.includes("===SECTION===") || /^\s*key\s*:/im.test(normalizedInput);
  const mode = resolveParserMode(normalizedInput, options?.mode);
  const schema = getEditorialSectionSchema(mode);

  if (!hasMachineFormat) {
    return parseLooseNarrative(normalizedInput, mode);
  }

  const blocks = splitSections(normalizedInput);

  const sections: ParsedSection[] = [];
  const warnings: ParserWarning[] = [];
  const errors: ParserError[] = [];
  const seenKeys = new Set<CanonicalSectionKey>();

  for (const block of blocks) {
    const rawKey = extractMachineKey(block);

    if (!rawKey) {
      errors.push({
        code: "MISSING_KEY",
        message: "Bloc sans cle technique."
      });
      continue;
    }

    const key = resolveCanonicalSectionKey(rawKey, mode, { allowLegacy: true });

    if (!key) {
      errors.push({
        code: "UNKNOWN_KEY",
        message: `Cle inconnue: ${rawKey}`
      });
      continue;
    }

    if (seenKeys.has(key)) {
      errors.push({
        code: "DUPLICATE_KEY",
        message: `Cle dupliquee: ${key}`,
        sectionKey: key
      });
      continue;
    }

    seenKeys.add(key);

    const template = schema.find((entry) => entry.key === key);
    if (!template) {
      errors.push({
        code: "UNKNOWN_KEY",
        message: `Cle inconnue: ${key}`,
        sectionKey: key
      });
      continue;
    }

    const titleValue = extractMachineMeta(block, "title");
    const subtitleValue = extractMachineMeta(block, "subtitle");

    const intro = extractMachineField(block, "intro");
    const body = extractMachineField(block, "body");
    const quote = extractMachineField(block, "quote");
    const signature = extractMachineField(block, "signature");

    const sectionWarnings: string[] = [];

    if (!titleValue) sectionWarnings.push("title manquant");
    if (!subtitleValue) sectionWarnings.push("subtitle manquant");

    if (!template.quoteOnly) {
      if (!intro) sectionWarnings.push("intro manquante");
      if (!body) sectionWarnings.push("body manquant");
    }

    if (!quote) sectionWarnings.push("quote manquante");

    const confidence =
      40 +
      (titleValue ? 10 : 0) +
      (subtitleValue ? 5 : 0) +
      (intro ? 15 : 0) +
      (body ? 15 : 0) +
      (quote ? 10 : 0) +
      (signature ? 5 : 0) -
      sectionWarnings.length * 5;

    sections.push({
      key,
      title: titleValue || template.title,
      subtitle: subtitleValue || template.subtitle,
      intro,
      body,
      quote,
      signature,
      sourceSlice: block,
      confidence: Math.max(0, Math.min(100, confidence)),
      warnings: sectionWarnings
    });
  }

  for (const template of schema) {
    if (!seenKeys.has(template.key)) {
      warnings.push({
        code: "SECTION_MISSING",
        message: `Section absente: ${template.key}`,
        sectionKey: template.key
      });
      sections.push({
        key: template.key,
        title: template.title,
        subtitle: template.subtitle,
        intro: "",
        body: "",
        quote: "",
        signature: "",
        sourceSlice: "",
        confidence: 0,
        warnings: ["Section absente"]
      });
    }
  }

  sections.sort(
    (left, right) =>
      schema.findIndex((section) => section.key === left.key) -
      schema.findIndex((section) => section.key === right.key)
  );

  const confidenceScore =
    sections.length > 0
      ? Math.round(sections.reduce((sum, section) => sum + section.confidence, 0) / sections.length)
      : 0;

  return {
    sections,
    warnings,
    errors,
    confidenceScore,
    normalizedInput
  };
}
