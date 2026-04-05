
import { z } from "zod";
import { createEmptyReport, applySignMeta } from "@/lib/templates";
import { parseAstroText } from "@/lib/parser";
import {
  ReportRecord,
  EditorialSection,
  SubjectPerson,
  SignKey,
  StructuredEditorialSection
} from "@/lib/types";
import { getSign } from "@/lib/signs";
import { getChartSignaturePoints } from "@/lib/chart-signatures";
import {
  applyStructuredSectionsToSource,
  deriveStructuredSectionsFromSource,
  sanitizeStructuredSections
} from "@/lib/editorial/structured-sections";

export type StudioReportDraft = ReportRecord;

const bodyBlockSchema = z.object({ id: z.string(), text: z.string(), intent: z.enum(["opening_line","nuanced_development","concrete_example","paradox_or_tension","elevated_closing"]).optional() });
const signatureSchema = z.object({ label: z.string(), text: z.string() });
const signKeySchema = z.enum(["belier","taureau","gemeaux","cancer","lion","vierge","balance","scorpion","sagittaire","capricorne","verseau","poissons"]);
const personSchema = z.object({
  firstName: z.string().catch(""), birthDate: z.string().catch(""), birthTime: z.string().catch(""), birthPlace: z.string().catch(""),
  signPrimary: z.union([signKeySchema, z.literal("")]).catch(""), signSymbol: z.string().catch(""), signImage: z.string().catch("")
});
const sectionSchema = z.object({
  id: z.string(), order: z.number(), semanticRole: z.string(), title: z.string(), subtitle: z.string(),
  type: z.enum(["cover","frontispiece","preface","toc","section_opening","editorial_spread","focus_page","quote_page","signature_page","conclusion_spread","method_note"]),
  intro: z.string().optional(), bodyBlocks: z.array(bodyBlockSchema).default([]), pullQuote: z.string().optional(), signatureBox: signatureSchema.optional(),
  edited: z
    .object({
      intro: z.boolean().optional(),
      body: z.boolean().optional(),
      quote: z.boolean().optional(),
      signature: z.boolean().optional()
    })
    .optional(),
  items: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
  signVignette: z.object({ imageKey: z.string(), alt: z.string(), style: z.enum(["line_art_editorial","soft_illustration_editorial","monochrome_symbolic"]), variant: z.string().optional() }).optional()
});
const structuredSectionSchema = z.object({
  key: z.string().catch(""),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  intro: z.string().catch(""),
  body: z.string().catch(""),
  quote: z.string().catch(""),
  signature: z.string().catch(""),
  edited: z
    .object({
      intro: z.boolean().optional(),
      body: z.boolean().optional(),
      quote: z.boolean().optional(),
      signature: z.boolean().optional()
    })
    .optional()
});
const baseSchema = z.object({
  id: z.string(), mode: z.enum(["solo","compatibility"]), status: z.enum(["draft","ready","archived"]).catch("draft"), createdAt: z.string(), updatedAt: z.string(),
  meta: z.object({ title: z.string(), subtitle: z.string(), brand: z.any(), theme: z.any() }),
  subjects: z.object({ solo: personSchema.optional(), personA: personSchema.optional(), personB: personSchema.optional(), relationshipVignette: z.any().optional() }),
  rawInputA: z.string().catch(""), rawInputB: z.string().optional(), parsedA: z.any(), parsedB: z.any().optional(),
  editorialSections: z.array(structuredSectionSchema).optional(),
  editorialSource: z.object({ sections: z.array(sectionSchema) }), rendering: z.any(), transformations: z.any(), qualityGuard: z.any(),
  share: z.object({ isPublished: z.boolean().catch(false), shareToken: z.string().nullable().catch(null), publishedAt: z.string().nullable().catch(null) }).optional()
});

function sanitizePerson(input: unknown): SubjectPerson {
  const parsed = personSchema.safeParse(input);
  const person = parsed.success ? parsed.data : { firstName: "", birthDate: "", birthTime: "", birthPlace: "", signPrimary: "" as SignKey | "", signSymbol: "", signImage: "" };
  return applySignMeta(person);
}

function normalizeTextKey(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeText(value?: string | null) {
  return (value ?? "").trim();
}

function dedupeBodyBlocks(blocks: { id: string; text: string }[], sectionId: string) {
  const seen = new Set<string>();
  const kept: { id: string; text: string }[] = [];
  for (const block of blocks) {
    const text = normalizeText(block.text);
    if (!text) continue;
    const key = normalizeTextKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push({ id: `${sectionId}_b${kept.length + 1}`, text });
  }
  return kept;
}

function mergeSection(templateSection: EditorialSection, source: EditorialSection): EditorialSection {
  const nextSignature = source.signatureBox
    ? {
        label: normalizeText(source.signatureBox.label) || templateSection.signatureBox?.label || "En une phrase",
        text: normalizeText(source.signatureBox.text)
      }
    : templateSection.signatureBox;

  return {
    ...templateSection,
    order: source.order,
    intro: normalizeText(source.intro ?? templateSection.intro),
    bodyBlocks: dedupeBodyBlocks((source.bodyBlocks as { id: string; text: string }[]) ?? [], templateSection.id),
    pullQuote: normalizeText(source.pullQuote ?? templateSection.pullQuote),
    edited: source.edited
      ? {
          intro: source.edited.intro,
          body: source.edited.body,
          quote: source.edited.quote,
          signature: source.edited.signature
        }
      : templateSection.edited,
    signatureBox: nextSignature,
    items: (source.items ?? templateSection.items ?? [])
      .map((item) => ({ title: normalizeText(item.title), text: normalizeText(item.text) }))
      .filter((item) => item.title || item.text)
  };
}

function sanitizeSections(input: EditorialSection[] | undefined, fallback: EditorialSection[]) {
  if (!input?.length) return fallback;

  const templateById = new Map(fallback.map((section) => [section.id, section]));
  const orderedSource = [...input].sort((a, b) => a.order - b.order);
  const usedIds = new Set<string>();
  const merged: EditorialSection[] = [];

  for (const source of orderedSource) {
    const templateSection = templateById.get(source.id);
    if (!templateSection) continue;
    merged.push(mergeSection(templateSection, source));
    usedIds.add(source.id);
  }

  for (const templateSection of fallback) {
    if (usedIds.has(templateSection.id)) continue;
    merged.push({ ...templateSection, order: merged.length + 1 });
  }

  return merged.map((section, index) => ({ ...section, order: index + 1 }));
}

function applyAutoSignFromChart(person: SubjectPerson | undefined, rawSign: string | null) {
  if (!person) return person;
  const sign = getSign(rawSign ?? person.signPrimary);
  return sign
    ? { ...person, signPrimary: sign.key, signSymbol: sign.symbol, signImage: sign.image }
    : person;
}

export function sanitizeReportDraft(input: unknown): ReportRecord {
  const parsed = baseSchema.safeParse(input);
  const mode = parsed.success ? parsed.data.mode : "solo";
  const base = createEmptyReport(mode);
  if (!parsed.success) return base;

  const record = parsed.data;
  const sanitizedSourceSections = sanitizeSections(
    record.editorialSource.sections as EditorialSection[],
    base.editorialSource.sections
  );
  const structuredFallback = deriveStructuredSectionsFromSource(sanitizedSourceSections, mode);
  const sanitizedStructuredSections = sanitizeStructuredSections(
    record.editorialSections as StructuredEditorialSection[] | undefined,
    structuredFallback,
    mode
  );
  const syncedSourceSections = applyStructuredSectionsToSource(
    sanitizedSourceSections,
    sanitizedStructuredSections,
    mode,
    { overwrite: false }
  );
  const next: ReportRecord = {
    ...base,
    ...record,
    meta: { ...base.meta, ...record.meta },
    subjects: mode === "solo"
      ? { solo: sanitizePerson(record.subjects.solo) }
      : { personA: sanitizePerson(record.subjects.personA), personB: sanitizePerson(record.subjects.personB), relationshipVignette: record.subjects.relationshipVignette ?? base.subjects.relationshipVignette },
    editorialSections: sanitizedStructuredSections,
    editorialSource: { sections: syncedSourceSections },
    share: { isPublished: Boolean(record.share?.isPublished), shareToken: record.share?.shareToken ?? null, publishedAt: record.share?.publishedAt ?? null }
  };

  next.rawInputA = next.rawInputA ?? "";
  next.parsedA = parseAstroText(next.rawInputA);
  if (mode === "compatibility") {
    next.rawInputB = next.rawInputB ?? "";
    next.parsedB = parseAstroText(next.rawInputB);
    next.subjects = {
      personA: next.subjects.personA,
      personB: next.subjects.personB,
      relationshipVignette: next.subjects.relationshipVignette
    };
  } else {
    next.rawInputB = "";
    next.parsedB = undefined;
    next.subjects = { solo: next.subjects.solo };
  }

  const autoSignA = getChartSignaturePoints(next.parsedA).find((point) => point.key === "sun")?.sign ?? null;
  const autoSignB = mode === "compatibility" ? getChartSignaturePoints(next.parsedB).find((point) => point.key === "sun")?.sign ?? null : null;

  if (mode === "solo") {
    next.subjects.solo = applyAutoSignFromChart(next.subjects.solo, autoSignA);
  } else {
    next.subjects.personA = applyAutoSignFromChart(next.subjects.personA, autoSignA);
    next.subjects.personB = applyAutoSignFromChart(next.subjects.personB, autoSignB);
  }

  next.updatedAt = new Date().toISOString();

  if (mode === "solo" && next.subjects.solo?.signPrimary) {
    const sign = getSign(next.subjects.solo.signPrimary);
    if (sign) next.editorialSource.sections[0].signVignette = { imageKey: sign.image, alt: `Illustration éditoriale du signe ${sign.label}`, style: "soft_illustration_editorial", variant: "hero" };
  }

  next.editorialSections = deriveStructuredSectionsFromSource(
    next.editorialSource.sections,
    mode,
    sanitizedStructuredSections
  );
  return next;
}
