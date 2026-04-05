import { EditorialSection, ReportRecord } from "@/lib/types";

export type MobileScreen =
  | { id: string; type: "cover_screen"; title: string; subtitle: string; firstName?: string; personA?: string; personB?: string; image?: string }
  | { id: string; type: "frontispiece_screen"; title: string; subtitle: string; quote?: string }
  | { id: string; type: "preface_screen"; title: string; subtitle: string; bodyBlocks: string[]; quote?: string }
  | { id: string; type: "toc_screen"; title: string; items: { label: string; target: string }[] }
  | { id: string; type: "section_intro_screen"; title: string; subtitle: string; intro?: string; image?: string }
  | { id: string; type: "body_screen"; body: string }
  | { id: string; type: "quote_card_screen"; quote: string }
  | { id: string; type: "signature_card_screen"; label: string; text: string }
  | { id: string; type: "mini_feature_screen"; title: string; text: string }
  | { id: string; type: "conclusion_screen"; title: string; subtitle: string; bodyBlocks: string[]; quote?: string; image?: string }
  | { id: string; type: "method_note_screen"; title: string; subtitle: string; bodyBlocks: string[] };

function splitText(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [text.trim()].filter(Boolean);
  const chunks: string[] = []; let current: string[] = [];
  for (const word of words) { current.push(word); if (current.length >= maxWords) { chunks.push(current.join(" ")); current = []; } }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}
function toTocItems(sections: EditorialSection[]) {
  return sections.filter((section) => !["cover","frontispiece","preface","toc"].includes(section.semanticRole)).map((section) => ({ label: section.title, target: `screen_${section.id}_intro` }));
}
export function toMobileScreens(report: ReportRecord): MobileScreen[] {
  const maxWords = report.rendering.mobileReading.bodyBlockMaxWords; const sections = [...report.editorialSource.sections].sort((a,b) => a.order - b.order); const screens: MobileScreen[] = [];
  if (report.mode === "solo") screens.push({ id: "screen_cover", type: "cover_screen", title: report.meta.title, subtitle: report.meta.subtitle, firstName: report.subjects.solo?.firstName || "Non renseigné", image: report.subjects.solo?.signImage || undefined });
  else screens.push({ id: "screen_cover", type: "cover_screen", title: report.meta.title, subtitle: report.meta.subtitle, personA: report.subjects.personA?.firstName || "Profil A", personB: report.subjects.personB?.firstName || "Profil B", image: report.subjects.personA?.signImage || report.subjects.personB?.signImage || undefined });

  const frontispiece = sections.find((s) => s.semanticRole === "frontispiece");
  if (frontispiece) screens.push({ id: "screen_frontispiece", type: "frontispiece_screen", title: frontispiece.title, subtitle: frontispiece.subtitle, quote: frontispiece.pullQuote });
  const preface = sections.find((s) => s.semanticRole === "preface");
  if (preface) screens.push({ id: "screen_preface", type: "preface_screen", title: preface.title, subtitle: preface.subtitle, bodyBlocks: preface.bodyBlocks.map((block) => block.text), quote: preface.pullQuote });
  if (report.rendering.mobileReading.showToc) screens.push({ id: "screen_toc", type: "toc_screen", title: "Votre lecture", items: toTocItems(sections) });

  for (const section of sections) {
    if (["cover","frontispiece","preface","toc"].includes(section.semanticRole)) continue;
    screens.push({ id: `screen_${section.id}_intro`, type: "section_intro_screen", title: section.title, subtitle: section.subtitle, intro: section.intro, image: section.signVignette?.imageKey?.startsWith("/") ? section.signVignette.imageKey : undefined });
    for (const block of section.bodyBlocks) for (const part of splitText(block.text, maxWords)) screens.push({ id: `screen_${section.id}_${block.id}_${screens.length}`, type: "body_screen", body: part });
    if (section.pullQuote && report.rendering.mobileReading.quoteRendering === "card") screens.push({ id: `screen_${section.id}_quote`, type: "quote_card_screen", quote: section.pullQuote });
    if (section.signatureBox) screens.push({ id: `screen_${section.id}_signature`, type: "signature_card_screen", label: section.signatureBox.label, text: section.signatureBox.text || "À compléter" });
    if (section.items?.length) for (const item of section.items) screens.push({ id: `screen_${section.id}_${item.title}`, type: "mini_feature_screen", title: item.title, text: item.text });
  }
  const conclusion = sections.find((s) => s.semanticRole === "conclusion");
  if (conclusion) screens.push({ id: "screen_conclusion", type: "conclusion_screen", title: conclusion.title, subtitle: conclusion.subtitle, bodyBlocks: conclusion.bodyBlocks.map((block) => block.text), quote: conclusion.pullQuote, image: report.mode === "solo" ? report.subjects.solo?.signImage : report.subjects.personA?.signImage });
  const method = sections.find((s) => s.semanticRole === "method_note");
  if (method) screens.push({ id: "screen_method", type: "method_note_screen", title: method.title, subtitle: method.subtitle, bodyBlocks: method.bodyBlocks.map((block) => block.text) });
  return screens;
}
