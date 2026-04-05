
import { EditorialSection, BodyBlock, ReportMode } from "@/lib/types";

function normalize(input?: string | null): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoBlocks(source: string): string[] {
  return source
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanHeadingLine(input: string): string {
  return input
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d{1,2}[\).\-\s]+/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/^[-*]\s+/, "")
    .trim();
}

function looksLikeHeading(block: string): boolean {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 1) return false;
  const rawLine = lines[0];
  const line = cleanHeadingLine(rawLine);
  if (!line) return false;
  if (/^#{1,6}\s/.test(rawLine)) return true;
  if (line.length > 110) return false;
  if (/[.!?;]$/.test(line)) return false;
  return true;
}

function dedupeTexts(texts: string[]) {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const text of texts) {
    const key = normalize(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(text.trim());
  }
  return kept;
}

function toBodyBlocks(texts: string[], sectionId: string): BodyBlock[] {
  return dedupeTexts(texts)
    .map((text, index) => ({ id: `${sectionId}_b${index + 1}`, text }));
}

function soloAliases(section: EditorialSection): string[] {
  const extra: Record<string, string[]> = {
    cover: ["portrait intime", "couverture"],
    frontispiece: ["edition personnelle", "document confidentiel"],
    preface: ["avant de commencer", "lecture sensible", "preambule"],
    essence: ["l essence de votre presence"],
    overview: ["votre signature interieure", "grand portrait d ensemble"],
    presence: ["ce que vous degagez", "presence exterieure"],
    "inner-world": ["le paysage interieur"],
    emotional: ["le coeur que l on ne voit pas toujours", "votre besoin essentiel"],
    hidden: ["ce que vous gardez pour vous"],
    "mind-opening": ["l intelligence du lien"],
    thinking: ["votre maniere de penser"],
    voice: ["votre voix dans le monde"],
    "love-opening": ["l art d aimer"],
    love: ["votre style affectif"],
    desire: ["ce qui vous attire"],
    "action-opening": ["votre maniere d avancer"],
    action: ["votre force en mouvement"],
    daily: ["votre elegance dans le reel"],
    "relationship-opening": ["l epreuve du lien"],
    relationship: ["votre maniere de vous engager", "votre grande verite relationnelle"],
    "security-opening": ["votre base interieure"],
    security: ["ce qui vous ancre"],
    "growth-opening": ["ce qui vous transforme"],
    growth: ["votre point sensible", "votre point de maturation"],
    "vocation-opening": ["la place qui vous appelle"],
    vocation: ["votre maniere de reussir"],
    signature: ["ce qui vous distingue", "forces signatures"],
    challenge: ["ce qui vous demande le plus de finesse", "defis recurrents"],
    balance: ["ce qui vous reaccorde", "cles d equilibre"],
    conclusion: ["l art d etre pleinement vous", "conclusion personnelle"],
    method: ["a propos de cette lecture", "note de methode", "cadre intention nuances"]
  };
  return [section.title, section.subtitle, section.semanticRole, section.id, ...(extra[section.id] ?? [])].map(normalize);
}

function compatibilityAliases(section: EditorialSection): string[] {
  const extra: Record<string, string[]> = {
    cover: ["correspondances intimes", "couverture"],
    frontispiece: ["edition relationnelle", "document confidentiel"],
    preface: ["avant de vous lire ensemble", "preambule"],
    "link-opening": ["l essence de votre lien"],
    overview: ["votre signature relationnelle", "grand portrait d ensemble du lien"],
    chemistry: ["ce qui se passe entre vous", "atmosphere immediate"],
    "emotional-opening": ["le paysage affectif du lien"],
    emotional: ["ce qui vous rapproche en profondeur"],
    "cross-sensitivities": ["ce que vous reveillez l un chez l autre"],
    "communication-opening": ["l intelligence du duo"],
    communication: ["votre langage commun"],
    dialogue: ["ce qui circule entre vous"],
    "love-opening": ["l art d aimer ensemble"],
    love: ["votre style relationnel"],
    desire: ["ce qui vous attire"],
    "daily-opening": ["votre maniere de fonctionner a deux"],
    action: ["votre force en mouvement"],
    daily: ["votre elegance dans le reel"],
    "deep-opening": ["l epreuve du face a face"],
    "deep-link": ["votre maniere de vous rencontrer vraiment"],
    "security-opening": ["votre base commune"],
    security: ["ce qui vous ancre ensemble"],
    "growth-opening": ["ce qui vous transforme"],
    growth: ["votre point sensible a deux"],
    "future-opening": ["la place que ce lien peut prendre"],
    future: ["votre maniere de construire ensemble"],
    signature: ["ce qui vous distingue ensemble"],
    challenge: ["ce qui vous demande le plus de finesse"],
    balance: ["ce qui vous reaccorde"],
    conclusion: ["l art d habiter ce lien"],
    method: ["a propos de cette lecture", "note de methode", "cadre intention nuances"]
  };
  return [section.title, section.subtitle, section.semanticRole, section.id, ...(extra[section.id] ?? [])].map(normalize);
}

function aliasesForSection(section: EditorialSection, mode: ReportMode): string[] {
  return mode === "compatibility" ? compatibilityAliases(section) : soloAliases(section);
}

function scoreHeading(heading: string, section: EditorialSection, mode: ReportMode): number {
  const normalizedHeading = normalize(cleanHeadingLine(heading));
  let best = 0;
  for (const alias of aliasesForSection(section, mode)) {
    if (!alias) continue;
    if (alias === normalizedHeading) best = Math.max(best, 100);
    else if (alias.includes(normalizedHeading) || normalizedHeading.includes(alias)) best = Math.max(best, 75);
    else {
      const hWords = normalizedHeading.split(" ");
      const aWords = alias.split(" ");
      const overlap = hWords.filter((word) => aWords.includes(word)).length;
      best = Math.max(best, overlap * 12);
    }
  }
  return best;
}

const compatibilityMarkers = [
  "a deux",
  "duo",
  "le lien",
  "entre vous",
  "vous deux",
  "ensemble",
  "couple",
  "relation",
  "partenaire",
  "personne a",
  "personne b",
  "l un",
  "l autre",
  "ce qui vous rapproche",
  "ce qui vous ancre ensemble",
  "votre maniere de construire ensemble",
  "votre style relationnel"
];

const soloMarkers = [
  "portrait intime",
  "edition personnelle",
  "lecture personnelle",
  "votre signature interieure",
  "ce que vous degagez",
  "votre base interieure",
  "l art d etre pleinement vous",
  "votre maniere de reussir",
  "ce que vous gardez pour vous",
  "vous meme",
  "personnelle"
];

function countMarkers(text: string, markers: string[]) {
  const source = normalize(text);
  return markers.reduce((score, marker) => (source.includes(marker) ? score + 1 : score), 0);
}

function shouldKeepNarrativeBlock(block: string, mode: ReportMode) {
  const soloScore = countMarkers(block, soloMarkers);
  const compatibilityScore = countMarkers(block, compatibilityMarkers);

  if (mode === "solo") {
    if (compatibilityScore > 0 && compatibilityScore >= soloScore + 1) return false;
    return true;
  }

  if (soloScore > 0 && soloScore >= compatibilityScore + 1) return false;
  return true;
}

export function dispatchEditorialPaste(raw: string, sections: EditorialSection[], mode: ReportMode): EditorialSection[] {
  const sourceBlocks = splitIntoBlocks(raw);
  if (sourceBlocks.length === 0) return sections;

  const updated = sections.map((section) => ({
    ...section,
    bodyBlocks: section.bodyBlocks.map((block) => ({ ...block })),
    edited: section.edited ? { ...section.edited } : undefined
  }));
  let currentSectionIndex = 0;
  let pending: string[] = [];
  const acceptedNarrativeBlocks: string[] = [];
  const sectionBuffers = new Map<number, string[]>();

  function appendToSectionBuffer(index: number, texts: string[]) {
    if (!texts.length) return;
    const current = sectionBuffers.get(index) ?? [];
    current.push(...texts);
    sectionBuffers.set(index, current);
  }

  function flushPending() {
    if (!pending.length) return;
    appendToSectionBuffer(currentSectionIndex, pending);
    pending = [];
  }

  for (const block of sourceBlocks) {
    if (looksLikeHeading(block)) {
      const scored = updated
        .map((section, index) => ({ index, score: scoreHeading(block, section, mode) }))
        .sort((a, b) => b.score - a.score);

      if (scored[0] && scored[0].score >= 36) {
        flushPending();
        currentSectionIndex = scored[0].index;
        continue;
      }
    }

    if (!shouldKeepNarrativeBlock(block, mode)) continue;
    pending.push(block);
    acceptedNarrativeBlocks.push(block);
  }

  flushPending();

  if (!sectionBuffers.size && acceptedNarrativeBlocks.length) {
    appendToSectionBuffer(0, acceptedNarrativeBlocks);
  }

  for (const [sectionIndex, texts] of sectionBuffers.entries()) {
    const target = updated[sectionIndex];
    target.bodyBlocks = toBodyBlocks(texts, target.id);
    target.edited = {
      ...target.edited,
      body: false
    };
  }

  return updated;
}
