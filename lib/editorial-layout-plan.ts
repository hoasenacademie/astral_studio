import { getChartSignaturePoints, SignaturePoint } from "@/lib/chart-signatures";
import { getRenderableSections, toUniqueParagraphs } from "@/lib/editorial-normalizer";
import { applyStructuredSectionsToSource } from "@/lib/editorial/structured-sections";
import { EditorialSection, ReportRecord, SignatureBox } from "@/lib/types";

export type LayoutPageKind = "cover_page" | "signature_page" | "editorial_page" | "quote_page" | "conclusion_page";

export type LayoutSignatureColumn = {
  label: string;
  points: SignaturePoint[];
};

export type LayoutCoverPage = {
  kind: "cover_page";
  key: string;
  title: string;
  subtitle: string;
  subjectLabel: string;
  brandLabel: string;
};

export type LayoutSignaturePage = {
  kind: "signature_page";
  key: string;
  title: string;
  subtitle: string;
  columns: LayoutSignatureColumn[];
};

export type LayoutEditorialPage = {
  kind: "editorial_page";
  key: string;
  sectionId: string;
  order: number;
  title: string;
  subtitle: string;
  introParagraphs: string[];
  bodyParagraphs: string[];
  inlineQuote: string | null;
  signatureBox: SignatureBox | null;
  isMethodNote: boolean;
  sectionType: EditorialSection["type"];
};

export type LayoutQuotePage = {
  kind: "quote_page";
  key: string;
  text: string;
  sourceSectionId: string;
};

export type LayoutConclusionPage = {
  kind: "conclusion_page";
  key: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  finalLine: string;
  signatureReminderLines: string[];
};

export type EditorialLayoutPage =
  | LayoutCoverPage
  | LayoutSignaturePage
  | LayoutEditorialPage
  | LayoutQuotePage
  | LayoutConclusionPage;

function normalizeKey(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function countWords(input: string) {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

function safeSectionText(value?: string | null): string {
  const source = (value ?? "").trim();
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

function textOrFallback(value?: string) {
  return value && value.trim() ? value : "Non renseigne";
}

function subjectLabel(report: ReportRecord) {
  return report.mode === "solo"
    ? textOrFallback(report.subjects.solo?.firstName)
    : `${textOrFallback(report.subjects.personA?.firstName)} & ${textOrFallback(report.subjects.personB?.firstName)}`;
}

function getSignatureColumns(report: ReportRecord): LayoutSignatureColumn[] {
  const pointsA = getChartSignaturePoints(report.parsedA);
  if (report.mode === "solo") {
    return [{ label: textOrFallback(report.subjects.solo?.firstName), points: pointsA }];
  }

  const pointsB = getChartSignaturePoints(report.parsedB);
  return [
    { label: textOrFallback(report.subjects.personA?.firstName), points: pointsA },
    { label: textOrFallback(report.subjects.personB?.firstName), points: pointsB }
  ];
}

function sectionIntro(section: EditorialSection) {
  return toUniqueParagraphs(safeSectionText(section.intro ?? ""));
}

function sectionBody(section: EditorialSection) {
  return section.bodyBlocks.flatMap((block) => toUniqueParagraphs(safeSectionText(block.text)));
}

function firstStrongSentence(text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const words = countWords(sentence);
    if (words >= 7 && words <= 28) return sentence;
  }
  return null;
}

function extractQuoteCandidate(section: EditorialSection, introParagraphs: string[], bodyParagraphs: string[]) {
  const fromPullQuote = safeSectionText(section.pullQuote).trim();
  if (fromPullQuote && countWords(fromPullQuote) >= 6 && countWords(fromPullQuote) <= 30) return fromPullQuote;

  const candidates = [...introParagraphs, ...bodyParagraphs];
  for (const paragraph of candidates) {
    const sentence = firstStrongSentence(paragraph);
    if (sentence) return sentence;
    const words = countWords(paragraph);
    if (words >= 8 && words <= 22) return paragraph;
  }
  return null;
}

function isMethodSection(section: EditorialSection) {
  return section.type === "method_note" || normalizeKey(section.semanticRole).includes("method");
}

function isConclusionSection(section: EditorialSection) {
  const key = `${section.id} ${section.semanticRole} ${section.title}`.trim();
  return section.type === "conclusion_spread" || normalizeKey(key).includes("conclusion");
}

function signatureLine(column: LayoutSignatureColumn) {
  const pointSign = (key: SignaturePoint["key"]) => {
    const point = column.points.find((item) => item.key === key);
    return point?.asset?.label || point?.sign || "Non renseigne";
  };

  return `${column.label} · Soleil ${pointSign("sun")} · Lune ${pointSign("moon")} · Ascendant ${pointSign("ascendant")} · MC ${pointSign("midheaven")}`;
}

function buildConclusionPage(
  report: ReportRecord,
  section: EditorialSection | null,
  signatureColumns: LayoutSignatureColumn[]
): LayoutConclusionPage {
  const fallbackTitle = report.mode === "solo" ? "Ce chemin astrologique vous appartient" : "Ce lien astrologique vous appartient";
  const fallbackSubtitle = report.mode === "solo" ? "Conclusion editoriale" : "Conclusion relationnelle";

  if (!section) {
    return {
      kind: "conclusion_page",
      key: "conclusion-default",
      title: fallbackTitle,
      subtitle: fallbackSubtitle,
      paragraphs: [],
      finalLine: report.mode === "solo"
        ? "Votre signature se lit dans la nuance, la presence et la precision de vos choix."
        : "Votre duo trouve sa force dans la qualite de son ecoute et la justesse de son rythme.",
      signatureReminderLines: signatureColumns.map(signatureLine)
    };
  }

  const introParagraphs = sectionIntro(section);
  const bodyParagraphs = sectionBody(section);
  const allParagraphs = [...introParagraphs, ...bodyParagraphs];

  const candidate = extractQuoteCandidate(section, introParagraphs, bodyParagraphs) || section.pullQuote || allParagraphs.at(-1) || "";
  const safeQuote = safeSectionText(candidate);
  const fallbackFinal = report.mode === "solo"
    ? "Votre singularite se construit avec une elegance rare."
    : "Votre lien evolue avec une finesse rare.";
  const resolvedFinalLine = safeQuote.trim() || fallbackFinal;

  const paragraphs = allParagraphs.filter((paragraph) => normalizeKey(paragraph) !== normalizeKey(resolvedFinalLine));

  return {
    kind: "conclusion_page",
    key: `conclusion-${section.id}`,
    title: section.title || fallbackTitle,
    subtitle: section.subtitle || fallbackSubtitle,
    paragraphs,
    finalLine: resolvedFinalLine,
    signatureReminderLines: signatureColumns.map(signatureLine)
  };
}

export function resolveEditorialLayoutPlan(report: ReportRecord): EditorialLayoutPage[] {
  const mergedSourceSections = applyStructuredSectionsToSource(
    report.editorialSource.sections,
    report.editorialSections,
    report.mode,
    { overwrite: true }
  );
  const sections = getRenderableSections({
    ...report,
    editorialSource: { sections: mergedSourceSections }
  });
  const signatureColumns = getSignatureColumns(report);

  const methodSections = sections.filter(isMethodSection);
  const nonMethodSections = sections.filter((section) => !isMethodSection(section));

  const explicitConclusion = nonMethodSections.find(isConclusionSection) ?? null;
  const conclusionSection = explicitConclusion ?? (nonMethodSections.length ? nonMethodSections[nonMethodSections.length - 1] : null);
  const narrativeSections = nonMethodSections.filter((section) => section.id !== conclusionSection?.id);

  const plan: EditorialLayoutPage[] = [
    {
      kind: "cover_page",
      key: "cover",
      title: report.meta.title,
      subtitle: report.meta.subtitle,
      subjectLabel: subjectLabel(report),
      brandLabel: `${report.meta.brand.name} - ${report.meta.brand.signature}`
    },
    {
      kind: "signature_page",
      key: "signature",
      title: report.mode === "solo" ? "Les quatre reperes de votre theme" : "Les quatre reperes de vos themes",
      subtitle: "Soleil, Lune, Ascendant et Milieu du Ciel.",
      columns: signatureColumns
    }
  ];

  let pagesSinceQuote = 6;
  for (const section of narrativeSections) {
    const introParagraphs = sectionIntro(section);
    const bodyParagraphs = sectionBody(section);
    const safeInlineQuote = safeSectionText(section.pullQuote).trim();
    const signatureText = safeSectionText(section.signatureBox?.text).trim();
    const candidate = extractQuoteCandidate(section, introParagraphs, bodyParagraphs);
    const totalWords = countWords([...introParagraphs, ...bodyParagraphs].join(" "));
    const hasEditorialPayload = totalWords > 0 || Boolean(safeInlineQuote) || Boolean(signatureText);

    if (!hasEditorialPayload) {
      continue;
    }

    const quoteWords = countWords(candidate ?? "");
    const canInjectQuote = Boolean(candidate) && pagesSinceQuote >= 5;
    const isHighlightSection = section.type === "section_opening" || section.type === "focus_page";
    const shouldInjectQuote =
      canInjectQuote &&
      isHighlightSection &&
      totalWords >= 190 &&
      quoteWords >= 10;

    if (candidate && shouldInjectQuote) {
      plan.push({
        kind: "quote_page",
        key: `quote-${section.id}`,
        text: candidate,
        sourceSectionId: section.id
      });
      pagesSinceQuote = 0;
    }

    const suppressInlineQuote = Boolean(
      candidate &&
      shouldInjectQuote &&
      safeInlineQuote &&
      normalizeKey(candidate) === normalizeKey(safeInlineQuote)
    );

    const signatureBox = signatureText
      ? {
          label: section.signatureBox?.label || "En une phrase",
          text: signatureText
        }
      : null;

    plan.push({
      kind: "editorial_page",
      key: `editorial-${section.id}`,
      sectionId: section.id,
      order: section.order,
      title: section.title,
      subtitle: section.subtitle,
      introParagraphs,
      bodyParagraphs,
      inlineQuote: suppressInlineQuote ? null : (safeInlineQuote.trim() || null),
      signatureBox,
      isMethodNote: false,
      sectionType: section.type
    });
    pagesSinceQuote += 1;
  }

  for (const section of methodSections) {
    plan.push({
      kind: "editorial_page",
      key: `method-${section.id}`,
      sectionId: section.id,
      order: section.order,
      title: section.title,
      subtitle: section.subtitle,
      introParagraphs: sectionIntro(section),
      bodyParagraphs: sectionBody(section),
      inlineQuote: null,
      signatureBox: null,
      isMethodNote: true,
      sectionType: section.type
    });
  }

  plan.push(buildConclusionPage(report, conclusionSection, signatureColumns));
  return plan;
}
