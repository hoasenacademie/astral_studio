import {
  getEditorialSectionSchema,
  resolveCanonicalSectionKey,
  type CanonicalSectionKey,
  type EditorialSectionShape
} from "@/lib/editorial/section-schema";
import type { EditorialSection, ReportMode, StructuredEditorialSection } from "@/lib/types";

type CanonicalToSectionMap = Partial<Record<CanonicalSectionKey, string>>;

const SOLO_CANONICAL_TO_SECTION_ID: CanonicalToSectionMap = {
  preamble: "preface",
  quote_presence: "essence",
  portrait: "essence",
  presence: "overview",
  quote_depth: "inner-world",
  interior: "inner-world",
  inner_heart: "emotional",
  private_self: "hidden",
  relational_intelligence: "mind-opening",
  thinking_style: "thinking",
  quote_voice: "voice",
  voice_in_world: "voice",
  love_art: "love-opening",
  affective_style: "love",
  quote_desire: "desire",
  desire: "desire",
  drive_style: "action-opening",
  force_in_motion: "action",
  daily_elegance: "daily",
  quote_relationships: "relationship-opening",
  trial_of_relationship: "relationship-opening",
  engagement_style: "relationship",
  inner_base: "security-opening",
  anchors: "security",
  quote_fragility: "growth-opening",
  transformation: "growth-opening",
  sensitive_point: "growth",
  calling: "vocation-opening",
  success_style: "vocation",
  distinction: "signature",
  refinement_challenges: "challenge",
  rebalancing: "balance",
  about_reading: "method",
  conclusion: "conclusion"
};

const COMPATIBILITY_CANONICAL_TO_SECTION_ID: CanonicalToSectionMap = {
  compat_preamble: "preface",
  compat_quote_presence: "link-opening",
  compat_portrait: "link-opening",
  compat_presence: "overview",
  compat_quote_depth: "emotional-opening",
  compat_interior: "emotional-opening",
  compat_inner_heart: "emotional",
  compat_private_self: "cross-sensitivities",
  compat_relational_intelligence: "communication-opening",
  compat_thinking_style: "communication",
  compat_quote_voice: "dialogue",
  compat_voice_in_world: "dialogue",
  compat_love_art: "love-opening",
  compat_affective_style: "love",
  compat_quote_desire: "desire",
  compat_desire: "desire",
  compat_drive_style: "daily-opening",
  compat_force_in_motion: "action",
  compat_daily_elegance: "daily",
  compat_quote_relationships: "deep-opening",
  compat_trial_of_relationship: "deep-opening",
  compat_engagement_style: "deep-link",
  compat_inner_base: "security-opening",
  compat_anchors: "security",
  compat_quote_fragility: "growth-opening",
  compat_transformation: "growth-opening",
  compat_sensitive_point: "growth",
  compat_calling: "future-opening",
  compat_success_style: "future",
  compat_distinction: "signature",
  compat_refinement_challenges: "challenge",
  compat_rebalancing: "balance",
  compat_about_reading: "method",
  compat_conclusion: "conclusion"
};

function canonicalToSectionMap(mode: ReportMode): CanonicalToSectionMap {
  return mode === "compatibility" ? COMPATIBILITY_CANONICAL_TO_SECTION_ID : SOLO_CANONICAL_TO_SECTION_ID;
}

export function canonicalKeysForSectionId(
  sectionId: string,
  mode: ReportMode
): CanonicalSectionKey[] {
  const mapping = canonicalToSectionMap(mode);
  const keys: CanonicalSectionKey[] = [];
  for (const template of getEditorialSectionSchema(mode)) {
    if (mapping[template.key] === sectionId) keys.push(template.key);
  }
  return keys;
}

function normalizeText(value?: string | null) {
  return (value ?? "").trim();
}

function bodyFromBlocks(section: EditorialSection) {
  return section.bodyBlocks
    .map((block) => normalizeText(block.text))
    .filter(Boolean)
    .join("\n\n");
}

function toBodyBlocks(value: string, sectionId: string) {
  const chunks = value
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return chunks.map((text, index) => ({ id: `${sectionId}_b${index + 1}`, text }));
}

function sanitizeEditedFlags(
  input: unknown,
  fallback?: StructuredEditorialSection["edited"]
): StructuredEditorialSection["edited"] | undefined {
  const source =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : null;

  const next: NonNullable<StructuredEditorialSection["edited"]> = {
    intro:
      typeof source?.intro === "boolean"
        ? source.intro
        : fallback?.intro,
    body:
      typeof source?.body === "boolean"
        ? source.body
        : fallback?.body,
    quote:
      typeof source?.quote === "boolean"
        ? source.quote
        : fallback?.quote,
    signature:
      typeof source?.signature === "boolean"
        ? source.signature
        : fallback?.signature
  };

  const hasAnyValue =
    typeof next.intro === "boolean" ||
    typeof next.body === "boolean" ||
    typeof next.quote === "boolean" ||
    typeof next.signature === "boolean";

  return hasAnyValue ? next : undefined;
}

function withEditedFlag(
  section: EditorialSection,
  field: "intro" | "body" | "quote" | "signature"
) {
  const edited = section.edited
    ? { ...section.edited, [field]: true }
    : { [field]: true };
  section.edited = edited;
}

function emptyStructuredSection(template: EditorialSectionShape): StructuredEditorialSection {
  return {
    key: template.key,
    title: template.title,
    subtitle: template.subtitle ?? "",
    intro: "",
    body: "",
    quote: "",
    signature: "",
    edited: undefined
  };
}

export function createEmptyStructuredSections(mode: ReportMode = "solo"): StructuredEditorialSection[] {
  return getEditorialSectionSchema(mode).map((template) => emptyStructuredSection(template));
}

export function sanitizeStructuredSections(
  input: unknown,
  fallback: StructuredEditorialSection[],
  mode: ReportMode
): StructuredEditorialSection[] {
  if (!Array.isArray(input)) return fallback.map((section) => ({ ...section }));

  const byKey = new Map<string, unknown>();
  for (const item of input) {
    if (typeof item !== "object" || item === null) continue;
    const rawKey = normalizeText((item as { key?: string }).key);
    const key = resolveCanonicalSectionKey(rawKey, mode, { allowLegacy: true });
    if (!key) continue;
    byKey.set(key, item);
  }

  return getEditorialSectionSchema(mode).map((template, index) => {
    const fallbackSection = fallback[index] ?? emptyStructuredSection(template);
    const source = byKey.get(template.key);
    if (!source || typeof source !== "object") return fallbackSection;

    const row = source as Partial<StructuredEditorialSection>;
    return {
      key: template.key,
      title: normalizeText(row.title) || fallbackSection.title || template.title,
      subtitle: normalizeText(row.subtitle) || fallbackSection.subtitle || template.subtitle || "",
      intro: normalizeText(row.intro) || fallbackSection.intro,
      body: normalizeText(row.body) || fallbackSection.body,
      quote: normalizeText(row.quote) || fallbackSection.quote,
      signature: normalizeText(row.signature) || fallbackSection.signature,
      edited: sanitizeEditedFlags(
        (row as { edited?: unknown }).edited,
        fallbackSection.edited
      )
    };
  });
}

export function deriveStructuredSectionsFromSource(
  sourceSections: EditorialSection[],
  mode: ReportMode,
  fallback?: StructuredEditorialSection[]
): StructuredEditorialSection[] {
  const sourceById = new Map(sourceSections.map((section) => [section.id, section]));
  const mapping = canonicalToSectionMap(mode);
  const fallbackByKey = new Map((fallback ?? []).map((section) => [section.key, section]));

  return getEditorialSectionSchema(mode).map((template) => {
    const targetSectionId = mapping[template.key];
    const source = targetSectionId ? sourceById.get(targetSectionId) : undefined;
    const fallbackSection = fallbackByKey.get(template.key);
    const empty = emptyStructuredSection(template);
    if (!source) {
      return fallbackSection
        ? { ...fallbackSection }
        : empty;
    }

    const quote = normalizeText(source.pullQuote);
    const intro = template.quoteOnly ? "" : normalizeText(source.intro);
    const body = template.quoteOnly ? "" : bodyFromBlocks(source);
    const signature = template.quoteOnly ? "" : normalizeText(source.signatureBox?.text);

    return {
      key: template.key,
      title: normalizeText(source.title) || template.title,
      subtitle: normalizeText(source.subtitle) || template.subtitle || "",
      intro,
      body,
      quote,
      signature,
      edited: sanitizeEditedFlags(source.edited, fallbackSection?.edited)
    };
  });
}

export function applyStructuredSectionsToSource(
  sourceSections: EditorialSection[],
  structuredSections: StructuredEditorialSection[],
  mode: ReportMode,
  options?: { overwrite?: boolean }
): EditorialSection[] {
  const overwrite = Boolean(options?.overwrite);
  const mapping = canonicalToSectionMap(mode);
  const nextSections = sourceSections.map((section) => ({
    ...section,
    bodyBlocks: section.bodyBlocks.map((block) => ({ ...block })),
    signatureBox: section.signatureBox ? { ...section.signatureBox } : undefined,
    edited: section.edited ? { ...section.edited } : undefined
  }));
  const sourceById = new Map(nextSections.map((section) => [section.id, section]));
  const structuredByKey = new Map(structuredSections.map((section) => [section.key, section]));

  for (const template of getEditorialSectionSchema(mode)) {
    const structured = structuredByKey.get(template.key);
    if (!structured) continue;

    const targetSectionId = mapping[template.key];
    if (!targetSectionId) continue;

    const target = sourceById.get(targetSectionId);
    if (!target) continue;

    if (structured.edited?.intro) withEditedFlag(target, "intro");
    if (structured.edited?.body) withEditedFlag(target, "body");
    if (structured.edited?.quote) withEditedFlag(target, "quote");
    if (structured.edited?.signature) withEditedFlag(target, "signature");

    if (structured.intro) {
      if (target.edited?.intro) {
        // Champ verrouille manuellement: on ne l'ecrase jamais.
      } else if (overwrite) target.intro = structured.intro;
      else if (!normalizeText(target.intro)) target.intro = structured.intro;
    }

    if (structured.body) {
      if (target.edited?.body) {
        // Champ verrouille manuellement: on ne l'ecrase jamais.
      } else if (overwrite) {
        target.bodyBlocks = toBodyBlocks(structured.body, target.id);
      } else if (!target.bodyBlocks.length) {
        target.bodyBlocks = toBodyBlocks(structured.body, target.id);
      }
    }

    if (structured.quote) {
      if (target.edited?.quote) {
        // Champ verrouille manuellement: on ne l'ecrase jamais.
      } else if (overwrite) target.pullQuote = structured.quote;
      else if (!normalizeText(target.pullQuote)) target.pullQuote = structured.quote;
    }

    if (structured.signature) {
      if (target.edited?.signature) {
        // Champ verrouille manuellement: on ne l'ecrase jamais.
      } else if (overwrite) {
        target.signatureBox = {
          label: target.signatureBox?.label || "En une phrase",
          text: structured.signature
        };
      } else if (!normalizeText(target.signatureBox?.text)) {
        target.signatureBox = {
          label: target.signatureBox?.label || "En une phrase",
          text: structured.signature
        };
      }
    }
  }

  return nextSections;
}

export function sectionHasEditorialContent(section: {
  intro: string;
  body: string;
  quote: string;
  signature: string;
}) {
  return Boolean(
    section.intro.trim() ||
      section.body.trim() ||
      section.quote.trim() ||
      section.signature.trim()
  );
}
