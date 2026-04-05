import { EditorialSection, RenderingProfile, TransformationRules, QualityGuard, ReportRecord } from "@/lib/types";
import { getSign } from "@/lib/signs";
import type { ReportMode, SubjectPerson } from "@/lib/types";
import { createEmptyStructuredSections } from "@/lib/editorial/structured-sections";

const brand = {
  name: "Astral Studio",
  signature: "Document confidentiel",
  palette: {
    background: "#F5F2EE",
    textPrimary: "#161616",
    textSecondary: "#6E6A67",
    accent: "#C8A39B",
    accentDark: "#8C6A61",
    line: "#D8D1CA"
  },
  typography: {
    display: "Editorial Serif",
    heading: "Editorial Serif",
    body: "Readable Serif",
    caption: "Modern Sans"
  }
} as const;

const theme = {
  name: "editorial_vogue_luxe",
  visualDirection: "luxury_magazine",
  displayMode: "light"
} as const;

const rendering: RenderingProfile = {
  pdfPrint: {
    mode: "paged_editorial",
    pageSize: "A4",
    showToc: true,
    showPageNumbers: true,
    showSectionOpenings: true,
    showLargeSignVignettes: true,
    bodyBlockMaxWords: 220,
    quoteRendering: "full_page_or_inline",
    signatureBoxRendering: "outlined_soft"
  },
  mobileReading: {
    mode: "vertical_storyflow",
    showToc: true,
    showProgressIndicator: true,
    showBackToTop: true,
    showContinueReading: true,
    bodyBlockMaxWords: 110,
    quoteRendering: "card",
    signatureBoxRendering: "soft_card"
  }
};

const transformations: TransformationRules = {
  splitLongBodyBlocksForMobile: true,
  mobileBodyBlockTargetWords: 90,
  mobileBodyBlockMaxWords: 120,
  convertPullQuotesToMobileCards: true,
  convertSignatureBoxesToSoftCards: true
};

const qualityGuard: QualityGuard = {
  hideInternalLabels: true,
  hideDebugDataInClientMode: true,
  preventDuplicateParagraphs: true,
  preventUnbrokenMobileBlocksOverWords: 120,
  requireMobileToc: true,
  requireMobileProgressBar: true,
  requireMobileQuoteCards: true
};

function mkSection(input: Partial<EditorialSection> & Pick<EditorialSection, "id" | "order" | "semanticRole" | "title" | "subtitle" | "type">): EditorialSection {
  return { intro: "", bodyBlocks: [], items: [], ...input };
}

export function defaultSoloSections(): EditorialSection[] {
  return [
    mkSection({ id: "cover", order: 1, semanticRole: "cover", title: "Portrait intime", subtitle: "Lecture personnelle & trajectoire intérieure", type: "cover" }),
    mkSection({ id: "frontispiece", order: 2, semanticRole: "frontispiece", title: "Édition personnelle", subtitle: "Document confidentiel", type: "frontispiece", pullQuote: "Certaines lectures informent. D’autres révèlent." }),
    mkSection({ id: "preface", order: 3, semanticRole: "preface", title: "Avant de commencer", subtitle: "Une lecture sensible, à recevoir comme un reflet", type: "preface", bodyBlocks: [
      { id: "preface_1", text: "Ce document propose une lecture symbolique et nuancée de votre personnalité." },
      { id: "preface_2", text: "Il met en lumière des lignes de force, des sensibilités, des manières d’aimer, d’avancer et d’habiter le lien." },
      { id: "preface_3", text: "Il ne cherche pas à vous enfermer dans une définition, mais à offrir un miroir subtil, incarné et élégant." }
    ], pullQuote: "À lire comme une rencontre avec soi, non comme une définition." }),
    mkSection({ id: "toc", order: 4, semanticRole: "toc", title: "Votre lecture", subtitle: "Les grands chapitres de votre portrait", type: "toc" }),
    mkSection({ id: "essence", order: 5, semanticRole: "identity_overview", title: "L’essence de votre présence", subtitle: "Ce que l’on perçoit de vous avant même les mots", type: "section_opening", intro: "Certaines présences se lisent d’abord dans l’impression qu’elles laissent." }),
    mkSection({ id: "overview", order: 6, semanticRole: "presence", title: "Votre signature intérieure", subtitle: "Le climat général de votre personnalité", type: "editorial_spread", pullQuote: "Une personnalité de finesse, d’intensité et de vérité relationnelle.", signatureBox: { label: "En une phrase", text: "Une présence subtile, profonde et marquante." } }),
    mkSection({ id: "presence", order: 7, semanticRole: "presence", title: "Ce que vous dégagez", subtitle: "Votre présence, votre allure, votre impact immédiat", type: "editorial_spread" }),
    mkSection({ id: "inner-world", order: 8, semanticRole: "emotional", title: "Le paysage intérieur", subtitle: "Vos émotions, vos besoins profonds, votre vie secrète", type: "section_opening", pullQuote: "La profondeur d’une personne se révèle souvent dans ce qu’elle protège." }),
    mkSection({ id: "emotional", order: 9, semanticRole: "emotional", title: "Le cœur que l’on ne voit pas toujours", subtitle: "Votre manière de ressentir, de vous protéger et de vous attacher", type: "editorial_spread", signatureBox: { label: "Votre besoin essentiel", text: "" } }),
    mkSection({ id: "hidden", order: 10, semanticRole: "emotional", title: "Ce que vous gardez pour vous", subtitle: "Réserve, vulnérabilité, profondeur silencieuse", type: "focus_page", pullQuote: "Certaines parts de vous n’ont pas besoin d’être visibles pour être décisives." }),
    mkSection({ id: "mind-opening", order: 11, semanticRole: "communication", title: "L’intelligence du lien", subtitle: "Votre manière de comprendre, de parler et de créer la relation", type: "section_opening" }),
    mkSection({ id: "thinking", order: 12, semanticRole: "communication", title: "Votre manière de penser", subtitle: "Clarté, nuance, instinct, discernement", type: "editorial_spread" }),
    mkSection({ id: "voice", order: 13, semanticRole: "communication", title: "Votre voix dans le monde", subtitle: "Ce que vous dites, ce que vous suggérez, ce que vous imposez sans bruit", type: "focus_page", pullQuote: "Votre parole ne sert pas seulement à dire. Elle sert aussi à placer, relier, nuancer, parfois protéger." }),
    mkSection({ id: "love-opening", order: 14, semanticRole: "love", title: "L’art d’aimer", subtitle: "Attachement, tendresse, désir d’être choisie", type: "section_opening", pullQuote: "Aimer, c’est aussi révéler sa manière de faire confiance, d’attendre et de se donner." }),
    mkSection({ id: "love", order: 15, semanticRole: "love", title: "Votre style affectif", subtitle: "Ce que vous cherchez, ce que vous offrez, ce que vous espérez profondément", type: "editorial_spread" }),
    mkSection({ id: "desire", order: 16, semanticRole: "desire", title: "Ce qui vous attire", subtitle: "Magnétisme, intensité, rythme du désir", type: "focus_page", pullQuote: "Chez vous, le désir semble moins relever de la légèreté que de l’intensité de présence." }),
    mkSection({ id: "action-opening", order: 17, semanticRole: "action", title: "Votre manière d’avancer", subtitle: "Volonté, rythme, effort, rapport au concret", type: "section_opening" }),
    mkSection({ id: "action", order: 18, semanticRole: "action", title: "Votre force en mouvement", subtitle: "Décision, courage, affirmation, gestion de la tension", type: "editorial_spread" }),
    mkSection({ id: "daily", order: 19, semanticRole: "daily", title: "Votre élégance dans le réel", subtitle: "Rythme de vie, exigence, organisation, sens du détail", type: "editorial_spread" }),
    mkSection({ id: "relationship-opening", order: 20, semanticRole: "relationship", title: "L’épreuve du lien", subtitle: "Ce que les relations éveillent, révèlent et transforment en vous", type: "section_opening", pullQuote: "Les relations importantes ne se contentent pas de nous accompagner : elles activent des parts profondes de nous-mêmes." }),
    mkSection({ id: "relationship", order: 21, semanticRole: "relationship", title: "Votre manière de vous engager", subtitle: "Choisir, vous unir, vous révéler dans le face-à-face", type: "editorial_spread", signatureBox: { label: "Votre grande vérité relationnelle", text: "" } }),
    mkSection({ id: "security-opening", order: 22, semanticRole: "security", title: "Votre base intérieure", subtitle: "Sécurité, estime de soi, rapport à la stabilité", type: "section_opening" }),
    mkSection({ id: "security", order: 23, semanticRole: "security", title: "Ce qui vous ancre", subtitle: "Valeur personnelle, confort intérieur, rapport au tangible", type: "editorial_spread" }),
    mkSection({ id: "growth-opening", order: 24, semanticRole: "growth", title: "Ce qui vous transforme", subtitle: "La zone sensible, la leçon intime, la force acquise", type: "section_opening", pullQuote: "Ce qui nous fragilise le plus est parfois aussi ce qui nous rend les plus profonds." }),
    mkSection({ id: "growth", order: 25, semanticRole: "growth", title: "Votre point sensible", subtitle: "Ce qui vous touche, ce qui vous forme, ce qui devient une force", type: "editorial_spread", signatureBox: { label: "Votre point de maturation", text: "" } }),
    mkSection({ id: "vocation-opening", order: 26, semanticRole: "vocation", title: "La place qui vous appelle", subtitle: "Rayonnement, vocation, visibilité, accomplissement", type: "section_opening", pullQuote: "Toute personnalité porte en elle une certaine idée de la place juste : celle où sa vérité devient visible sans se trahir." }),
    mkSection({ id: "vocation", order: 27, semanticRole: "vocation", title: "Votre manière de réussir", subtitle: "Image, ambition, contribution, influence", type: "editorial_spread" }),
    mkSection({ id: "signature", order: 28, semanticRole: "signature", title: "Ce qui vous distingue", subtitle: "Vos qualités les plus marquantes", type: "signature_page" }),
    mkSection({ id: "challenge", order: 29, semanticRole: "challenge", title: "Ce qui vous demande le plus de finesse", subtitle: "Vos zones de tension et d’ajustement", type: "signature_page" }),
    mkSection({ id: "balance", order: 30, semanticRole: "balance", title: "Ce qui vous réaccorde", subtitle: "Vos appuis intérieurs, vos gestes d’équilibre, votre juste fréquence", type: "signature_page" }),
    mkSection({ id: "conclusion", order: 31, semanticRole: "conclusion", title: "L’art d’être pleinement vous", subtitle: "Conclusion personnelle", type: "conclusion_spread", pullQuote: "Votre puissance ne semble pas venir de l’évidence, mais de la profondeur avec laquelle vous habitez ce qui compte vraiment." }),
    mkSection({ id: "method", order: 32, semanticRole: "method_note", title: "À propos de cette lecture", subtitle: "Cadre, intention, nuances", type: "method_note", bodyBlocks: [{ id: "method_1", text: "Cette lecture propose un éclairage symbolique et sensible. Elle ne remplace ni votre libre arbitre, ni votre expérience, ni la complexité vivante de votre parcours." }] })
  ];
}

export function defaultCompatibilitySections(): EditorialSection[] {
  return [
    mkSection({ id: "cover", order: 1, semanticRole: "cover", title: "Correspondances intimes", subtitle: "Lecture relationnelle & dynamique du lien", type: "cover" }),
    mkSection({ id: "frontispiece", order: 2, semanticRole: "frontispiece", title: "Édition relationnelle", subtitle: "Document confidentiel", type: "frontispiece", pullQuote: "Certaines rencontres rapprochent. D’autres révèlent." }),
    mkSection({ id: "preface", order: 3, semanticRole: "preface", title: "Avant de vous lire ensemble", subtitle: "Une lecture sensible, à recevoir comme un reflet du lien", type: "preface", bodyBlocks: [{ id: "preface_1", text: "Ce document propose une lecture symbolique et nuancée de votre dynamique relationnelle." }, { id: "preface_2", text: "Il met en lumière des lignes de force, des résonances, des décalages et des potentiels d’évolution." }, { id: "preface_3", text: "Il ne cherche pas à enfermer votre relation dans une définition, mais à offrir un miroir subtil, incarné et élégant." }], pullQuote: "À lire comme un reflet du lien, non comme un verdict." }),
    mkSection({ id: "toc", order: 4, semanticRole: "toc", title: "Votre lecture", subtitle: "Les grands mouvements de votre relation", type: "toc" }),
    mkSection({ id: "link-opening", order: 5, semanticRole: "compatibility_overview", title: "L’essence de votre lien", subtitle: "Ce que l’on ressent entre vous avant même les explications", type: "section_opening", intro: "Certaines relations se comprennent par les faits. D’autres par l’atmosphère qu’elles dégagent." }),
    mkSection({ id: "overview", order: 6, semanticRole: "compatibility_overview", title: "Votre signature relationnelle", subtitle: "Le climat général de votre duo", type: "editorial_spread", pullQuote: "Un lien de finesse, d’intensité et de révélation mutuelle.", signatureBox: { label: "En une phrase", text: "Une relation qui ne banalise ni l’attachement, ni la transformation." } }),
    mkSection({ id: "chemistry", order: 7, semanticRole: "compatibility_atmosphere", title: "Ce qui se passe entre vous", subtitle: "Première impression, magnétisme, tonalité immédiate", type: "editorial_spread" }),
    mkSection({ id: "emotional-opening", order: 8, semanticRole: "compatibility_emotional", title: "Le paysage affectif du lien", subtitle: "Vos émotions, vos besoins, vos résonances profondes", type: "section_opening", pullQuote: "La vérité d’une relation apparaît souvent dans sa manière d’accueillir l’émotion." }),
    mkSection({ id: "emotional", order: 9, semanticRole: "compatibility_emotional", title: "Ce qui vous rapproche en profondeur", subtitle: "Sensibilité, réassurance, intimité émotionnelle", type: "editorial_spread", signatureBox: { label: "Votre besoin essentiel à deux", text: "" } }),
    mkSection({ id: "cross-sensitivities", order: 10, semanticRole: "compatibility_cross_sensitivities", title: "Ce que vous réveillez l’un chez l’autre", subtitle: "Vulnérabilité, pudeur, résonances silencieuses", type: "focus_page", pullQuote: "Certaines parts de soi ne se révèlent pas dans toutes les relations." }),
    mkSection({ id: "communication-opening", order: 11, semanticRole: "compatibility_communication", title: "L’intelligence du duo", subtitle: "Votre manière de vous comprendre, de vous parler et de vous ajuster", type: "section_opening" }),
    mkSection({ id: "communication", order: 12, semanticRole: "compatibility_communication", title: "Votre langage commun", subtitle: "Clarté, nuance, compréhension, décalages", type: "editorial_spread" }),
    mkSection({ id: "dialogue", order: 13, semanticRole: "compatibility_dialogue", title: "Ce qui circule entre vous", subtitle: "Parole, écoute, non-dits, vérité relationnelle", type: "focus_page", pullQuote: "La parole dans un lien ne sert pas seulement à expliquer. Elle sert aussi à rassurer, placer, réparer ou révéler." }),
    mkSection({ id: "love-opening", order: 14, semanticRole: "compatibility_love", title: "L’art d’aimer ensemble", subtitle: "Attachement, tendresse, désir de se choisir", type: "section_opening", pullQuote: "Chaque relation possède sa propre grammaire affective." }),
    mkSection({ id: "love", order: 15, semanticRole: "compatibility_love", title: "Votre style relationnel", subtitle: "Ce que vous cherchez, ce que vous offrez, ce que vous espérez ensemble", type: "editorial_spread" }),
    mkSection({ id: "desire", order: 16, semanticRole: "compatibility_desire", title: "Ce qui vous attire", subtitle: "Magnétisme, intensité, rythme du désir", type: "focus_page", pullQuote: "Le désir dans une relation ne parle pas seulement d’attirance. Il dit aussi ce qui met le lien en mouvement." }),
    mkSection({ id: "daily-opening", order: 17, semanticRole: "compatibility_daily_functioning", title: "Votre manière de fonctionner à deux", subtitle: "Rythme, effort, quotidien, organisation", type: "section_opening" }),
    mkSection({ id: "action", order: 18, semanticRole: "compatibility_daily_functioning", title: "Votre force en mouvement", subtitle: "Décision, élan, tension, manière d’avancer", type: "editorial_spread" }),
    mkSection({ id: "daily", order: 19, semanticRole: "compatibility_daily_functioning", title: "Votre élégance dans le réel", subtitle: "Habitudes, rythme de vie, organisation, qualité de présence", type: "editorial_spread" }),
    mkSection({ id: "deep-opening", order: 20, semanticRole: "compatibility_deep_link", title: "L’épreuve du face-à-face", subtitle: "Ce que cette relation révèle, intensifie et transforme", type: "section_opening", pullQuote: "Les relations importantes ne se contentent pas d’accompagner une vie. Elles activent des zones profondes." }),
    mkSection({ id: "deep-link", order: 21, semanticRole: "compatibility_deep_link", title: "Votre manière de vous rencontrer vraiment", subtitle: "Engagement, projection, vérité du duo", type: "editorial_spread", signatureBox: { label: "Votre grande vérité relationnelle", text: "" } }),
    mkSection({ id: "security-opening", order: 22, semanticRole: "compatibility_security", title: "Votre base commune", subtitle: "Sécurité, confiance, stabilité du lien", type: "section_opening" }),
    mkSection({ id: "security", order: 23, semanticRole: "compatibility_security", title: "Ce qui vous ancre ensemble", subtitle: "Confiance, fidélité, sécurité émotionnelle et concrète", type: "editorial_spread" }),
    mkSection({ id: "growth-opening", order: 24, semanticRole: "compatibility_growth", title: "Ce qui vous transforme", subtitle: "Fragilités, tensions, croissance du lien", type: "section_opening", pullQuote: "Toute relation profonde possède un endroit plus sensible." }),
    mkSection({ id: "growth", order: 25, semanticRole: "compatibility_growth", title: "Votre point sensible à deux", subtitle: "Ce qui vous touche, vous bouscule et peut vous faire grandir", type: "editorial_spread", signatureBox: { label: "Votre point de maturation", text: "" } }),
    mkSection({ id: "future-opening", order: 26, semanticRole: "compatibility_future", title: "La place que ce lien peut prendre", subtitle: "Potentiel, rayonnement, avenir relationnel", type: "section_opening", pullQuote: "Toute relation porte en elle une certaine idée de sa place juste." }),
    mkSection({ id: "future", order: 27, semanticRole: "compatibility_future", title: "Votre manière de construire ensemble", subtitle: "Durée, complémentarité, ambition du duo, influence mutuelle", type: "editorial_spread" }),
    mkSection({ id: "signature", order: 28, semanticRole: "signature", title: "Ce qui vous distingue ensemble", subtitle: "Les qualités les plus marquantes de votre duo", type: "signature_page" }),
    mkSection({ id: "challenge", order: 29, semanticRole: "challenge", title: "Ce qui vous demande le plus de finesse", subtitle: "Vos zones de tension et d’ajustement", type: "signature_page" }),
    mkSection({ id: "balance", order: 30, semanticRole: "balance", title: "Ce qui vous réaccorde", subtitle: "Vos appuis, vos gestes d’équilibre, votre juste rythme relationnel", type: "signature_page" }),
    mkSection({ id: "conclusion", order: 31, semanticRole: "conclusion", title: "L’art d’habiter ce lien", subtitle: "Conclusion relationnelle", type: "conclusion_spread", pullQuote: "Votre relation ne semble pas demander à être simplifiée, mais comprise avec davantage de justesse, de souffle et de profondeur." }),
    mkSection({ id: "method", order: 32, semanticRole: "method_note", title: "À propos de cette lecture", subtitle: "Cadre, intention, nuances", type: "method_note", bodyBlocks: [{ id: "method_1", text: "Cette lecture propose un éclairage symbolique et sensible. Elle ne remplace ni votre libre arbitre, ni l’expérience réelle du lien." }] })
  ];
}

function subjectBase(): SubjectPerson {
  return { firstName: "", birthDate: "", birthTime: "", birthPlace: "", signPrimary: "", signSymbol: "", signImage: "" };
}
export function createId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `report_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
export function createEmptyReport(mode: ReportMode): ReportRecord {
  const now = new Date().toISOString();
  const solo = mode === "solo";
  return {
    id: createId(), mode, status: "draft", createdAt: now, updatedAt: now,
    meta: { title: solo ? "Portrait intime" : "Correspondances intimes", subtitle: solo ? "Lecture personnelle & trajectoire intérieure" : "Lecture relationnelle & dynamique du lien", brand: { ...brand }, theme: { ...theme } },
    subjects: solo ? { solo: subjectBase() } : { personA: subjectBase(), personB: subjectBase(), relationshipVignette: { imageKey: "/signs/duo.png", alt: "Illustration éditoriale du duo", style: "soft_illustration_editorial", variant: "duo_hero" } },
    rawInputA: "", rawInputB: "", parsedA: { positions: [], houses: [], aspects: [], settings: [], warnings: [], confidence: 0 }, parsedB: { positions: [], houses: [], aspects: [], settings: [], warnings: [], confidence: 0 },
    editorialSections: createEmptyStructuredSections(mode),
    editorialSource: { sections: solo ? defaultSoloSections() : defaultCompatibilitySections() }, rendering, transformations, qualityGuard,
    share: { isPublished: false, shareToken: null, publishedAt: null }
  };
}
export function applySignMeta(subject: SubjectPerson): SubjectPerson {
  const sign = getSign(subject.signPrimary); if (!sign) return { ...subject, signSymbol: "", signImage: "" };
  return { ...subject, signSymbol: sign.symbol, signImage: sign.image };
}
