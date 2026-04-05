import { EditorialSection, ReportRecord } from "@/lib/types";

const hiddenRoles = new Set(["cover", "frontispiece", "toc", "epilogue"]);

function normalizeParagraphKey(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getRenderableSections(report: ReportRecord): EditorialSection[] {
  return [...report.editorialSource.sections]
    .sort((a, b) => a.order - b.order)
    .filter((section) => !hiddenRoles.has(section.semanticRole));
}

export function toUniqueParagraphs(text?: string): string[] {
  const chunks = (text ?? "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const chunk of chunks) {
    const key = normalizeParagraphKey(chunk);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(chunk);
  }

  return result;
}

