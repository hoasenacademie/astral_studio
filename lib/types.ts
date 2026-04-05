import type { CanonicalSectionKey } from "@/lib/editorial/section-schema";

export type ReportMode = "solo" | "compatibility";
export type ReportStatus = "draft" | "ready" | "archived";
export type SignKey =
  | "belier" | "taureau" | "gemeaux" | "cancer" | "lion" | "vierge"
  | "balance" | "scorpion" | "sagittaire" | "capricorne" | "verseau" | "poissons";

export type SignMeta = { key: SignKey; label: string; symbol: string; image: string; };
export type SubjectPerson = {
  firstName: string; birthDate: string; birthTime: string; birthPlace: string;
  signPrimary: SignKey | ""; signSymbol: string; signImage: string;
};
export type BrandTheme = {
  name: "editorial_vogue_luxe" | "editorial_soft_luxe" | "editorial_dark_luxe";
  visualDirection: "minimal_editorial" | "luxury_magazine" | "private_portfolio";
  displayMode: "light" | "dark" | "soft_neutral";
};
export type BrandMeta = {
  name: string; signature: string;
  palette: { background: string; textPrimary: string; textSecondary: string; accent: string; accentDark: string; line: string; };
  typography: { display: string; heading: string; body: string; caption: string; };
};
export type SignVignette = {
  imageKey: string; alt: string;
  style: "line_art_editorial" | "soft_illustration_editorial" | "monochrome_symbolic";
  variant?: "hero" | "inline" | "corner" | "full_focus" | "end_signature" | "hero_mobile" | "duo_hero" | "duo_inline" | "duo_full_focus";
};
export type BodyBlock = {
  id: string; text: string;
  intent?: "opening_line" | "nuanced_development" | "concrete_example" | "paradox_or_tension" | "elevated_closing";
};
export type SignatureBox = { label: string; text: string; };
export type StructuredEditorialSection = {
  key: CanonicalSectionKey;
  title: string;
  subtitle: string;
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
export type EditorialSection = {
  id: string; order: number; semanticRole: string; title: string; subtitle: string;
  type: "cover" | "frontispiece" | "preface" | "toc" | "section_opening" | "editorial_spread" | "focus_page" | "quote_page" | "signature_page" | "conclusion_spread" | "method_note";
  intro?: string; bodyBlocks: BodyBlock[]; pullQuote?: string; signatureBox?: SignatureBox;
  edited?: {
    intro?: boolean;
    body?: boolean;
    quote?: boolean;
    signature?: boolean;
  };
  items?: { title: string; text: string }[]; signVignette?: SignVignette;
};
export type RenderingProfile = {
  pdfPrint: { mode: "paged_editorial"; pageSize: "A4"; showToc: boolean; showPageNumbers: boolean; showSectionOpenings: boolean; showLargeSignVignettes: boolean; bodyBlockMaxWords: number; quoteRendering: "full_page_or_inline" | "inline_only"; signatureBoxRendering: "outlined_soft" | "filled_soft" | "minimal_line"; };
  mobileReading: { mode: "vertical_storyflow"; showToc: boolean; showProgressIndicator: boolean; showBackToTop: boolean; showContinueReading: boolean; bodyBlockMaxWords: number; quoteRendering: "card" | "inline"; signatureBoxRendering: "soft_card" | "outlined_card" | "minimal_card"; };
};
export type TransformationRules = {
  splitLongBodyBlocksForMobile: boolean; mobileBodyBlockTargetWords: number; mobileBodyBlockMaxWords: number; convertPullQuotesToMobileCards: boolean; convertSignatureBoxesToSoftCards: boolean;
};
export type QualityGuard = {
  hideInternalLabels: boolean; hideDebugDataInClientMode: boolean; preventDuplicateParagraphs: boolean; preventUnbrokenMobileBlocksOverWords: number; requireMobileToc: boolean; requireMobileProgressBar: boolean; requireMobileQuoteCards: boolean;
};
export type AstroPosition = { label: string; sign: string; degree?: number | null; minute?: number | null; retrograde?: boolean; house?: string | null; };
export type AstroHouse = { label: string; sign: string; degree?: number | null; minute?: number | null; };
export type AstroAspect = { from: string; to: string; type: string; orb?: string | null; };
export type AstroSetting = { label: string; value: string; };
export type ParsedChart = { positions: AstroPosition[]; houses: AstroHouse[]; aspects: AstroAspect[]; settings: AstroSetting[]; warnings: string[]; confidence: number; };
export type ShareSettings = { isPublished: boolean; shareToken: string | null; publishedAt: string | null; };
export type ReportRecord = {
  id: string; mode: ReportMode; status: ReportStatus; createdAt: string; updatedAt: string;
  meta: { title: string; subtitle: string; brand: BrandMeta; theme: BrandTheme; };
  subjects: { solo?: SubjectPerson; personA?: SubjectPerson; personB?: SubjectPerson; relationshipVignette?: SignVignette; };
  rawInputA: string; rawInputB?: string; parsedA: ParsedChart; parsedB?: ParsedChart;
  editorialSections: StructuredEditorialSection[];
  editorialSource: { sections: EditorialSection[]; }; rendering: RenderingProfile; transformations: TransformationRules; qualityGuard: QualityGuard;
  share: ShareSettings;
};
