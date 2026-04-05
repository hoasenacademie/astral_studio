import { getEditorialSectionSchema } from "@/lib/editorial/section-schema";
import type { ParserResult } from "@/lib/gpt-parser/types";
import type { ReportMode, StructuredEditorialSection } from "@/lib/types";

export type EditableSection = {
  key: string;
  title: string;
  subtitle?: string;
  intro: string;
  body: string;
  quote: string;
  signature: string;
  edited?: {
    intro?: boolean;
    body?: boolean;
    quote?: boolean;
    signature?: boolean;
  };
};

export type InjectionResult = {
  sections: StructuredEditorialSection[];
  blockingErrors: string[];
};

function toMap(sections: EditableSection[]) {
  return new Map(sections.map((section) => [section.key, section]));
}

export function mapParsedSectionsToEditorialSections(
  parsed: ParserResult,
  currentSections: EditableSection[],
  mode: ReportMode
): InjectionResult {
  const blockingErrors: string[] = [];

  if (parsed.errors.length > 0) {
    blockingErrors.push(...parsed.errors.map((error) => error.message));
  }

  const currentMap = toMap(currentSections);
  const parsedMap = new Map(parsed.sections.map((section) => [section.key, section]));
  const schema = getEditorialSectionSchema(mode);

  const sections: StructuredEditorialSection[] = schema.map((template) => {
    const current = currentMap.get(template.key);
    const incoming = parsedMap.get(template.key);

    if (!current) {
      blockingErrors.push(`Section absente du draft: ${template.key}`);
    }

    return {
      key: template.key,
      title: incoming?.title || current?.title || template.title,
      subtitle: incoming?.subtitle || current?.subtitle || template.subtitle || "",
      intro: current?.edited?.intro
        ? current.intro
        : incoming?.intro ?? current?.intro ?? "",
      body: current?.edited?.body
        ? current.body
        : incoming?.body ?? current?.body ?? "",
      quote: current?.edited?.quote
        ? current.quote
        : incoming?.quote ?? current?.quote ?? "",
      signature: current?.edited?.signature
        ? current.signature
        : incoming?.signature ?? current?.signature ?? "",
      edited: current?.edited
    };
  });

  return {
    sections,
    blockingErrors: Array.from(new Set(blockingErrors))
  };
}
