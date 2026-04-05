export type SoloCanonicalSectionKey =
  | "preamble"
  | "quote_presence"
  | "portrait"
  | "presence"
  | "quote_depth"
  | "interior"
  | "inner_heart"
  | "private_self"
  | "relational_intelligence"
  | "thinking_style"
  | "quote_voice"
  | "voice_in_world"
  | "love_art"
  | "affective_style"
  | "quote_desire"
  | "desire"
  | "drive_style"
  | "force_in_motion"
  | "daily_elegance"
  | "quote_relationships"
  | "trial_of_relationship"
  | "engagement_style"
  | "inner_base"
  | "anchors"
  | "quote_fragility"
  | "transformation"
  | "sensitive_point"
  | "calling"
  | "success_style"
  | "distinction"
  | "refinement_challenges"
  | "rebalancing"
  | "about_reading"
  | "conclusion";

export type CompatibilityCanonicalSectionKey =
  | "compat_preamble"
  | "compat_quote_presence"
  | "compat_portrait"
  | "compat_presence"
  | "compat_quote_depth"
  | "compat_interior"
  | "compat_inner_heart"
  | "compat_private_self"
  | "compat_relational_intelligence"
  | "compat_thinking_style"
  | "compat_quote_voice"
  | "compat_voice_in_world"
  | "compat_love_art"
  | "compat_affective_style"
  | "compat_quote_desire"
  | "compat_desire"
  | "compat_drive_style"
  | "compat_force_in_motion"
  | "compat_daily_elegance"
  | "compat_quote_relationships"
  | "compat_trial_of_relationship"
  | "compat_engagement_style"
  | "compat_inner_base"
  | "compat_anchors"
  | "compat_quote_fragility"
  | "compat_transformation"
  | "compat_sensitive_point"
  | "compat_calling"
  | "compat_success_style"
  | "compat_distinction"
  | "compat_refinement_challenges"
  | "compat_rebalancing"
  | "compat_about_reading"
  | "compat_conclusion";

export type CanonicalSectionKey = SoloCanonicalSectionKey | CompatibilityCanonicalSectionKey;

export type CanonicalSchemaMode = "solo" | "compatibility";

export type EditorialSectionShape = {
  key: CanonicalSectionKey;
  title: string;
  subtitle?: string;
  quoteOnly?: boolean;
};

export const SOLO_EDITORIAL_SECTION_SCHEMA: EditorialSectionShape[] = [
  { key: "preamble", title: "Avant de commencer", subtitle: "Une lecture sensible, a recevoir comme un reflet" },
  {
    key: "quote_presence",
    title: "Certaines presences se lisent d abord dans l impression qu elles laissent.",
    quoteOnly: true
  },
  { key: "portrait", title: "L essence de votre presence", subtitle: "Ce que l on percoit de vous avant meme les mots" },
  { key: "presence", title: "Votre signature interieure", subtitle: "Le climat general de votre personnalite" },
  { key: "quote_depth", title: "La profondeur d une personne se revele souvent dans ce qu elle protege.", quoteOnly: true },
  { key: "interior", title: "Le paysage interieur", subtitle: "Vos emotions, vos besoins profonds, votre vie secrete" },
  {
    key: "inner_heart",
    title: "Le coeur que l on ne voit pas toujours",
    subtitle: "Votre maniere de ressentir, de vous proteger et de vous attacher"
  },
  { key: "private_self", title: "Ce que vous gardez pour vous", subtitle: "Reserve, vulnerabilite, profondeur silencieuse" },
  {
    key: "relational_intelligence",
    title: "L intelligence du lien",
    subtitle: "Votre maniere de comprendre, de parler et de creer la relation"
  },
  { key: "thinking_style", title: "Votre maniere de penser", subtitle: "Clarte, nuance, instinct, discernement" },
  {
    key: "quote_voice",
    title: "Votre parole ne sert pas seulement a dire. Elle sert aussi a placer, relier, nuancer, parfois proteger.",
    quoteOnly: true
  },
  {
    key: "voice_in_world",
    title: "Votre voix dans le monde",
    subtitle: "Ce que vous dites, ce que vous suggerez, ce que vous imposez sans bruit"
  },
  { key: "love_art", title: "L art d aimer", subtitle: "Attachement, tendresse, desir d etre choisie" },
  {
    key: "affective_style",
    title: "Votre style affectif",
    subtitle: "Ce que vous cherchez, ce que vous offrez, ce que vous esperez profondement"
  },
  {
    key: "quote_desire",
    title: "Chez vous, le desir semble moins relever de la legerete que de l intensite de presence.",
    quoteOnly: true
  },
  { key: "desire", title: "Ce qui vous attire", subtitle: "Magnetisme, intensite, rythme du desir" },
  { key: "drive_style", title: "Votre maniere d avancer", subtitle: "Volonte, rythme, effort, rapport au concret" },
  {
    key: "force_in_motion",
    title: "Votre force en mouvement",
    subtitle: "Decision, courage, affirmation, gestion de la tension"
  },
  { key: "daily_elegance", title: "Votre elegance dans le reel", subtitle: "Rythme de vie, exigence, organisation, sens du detail" },
  {
    key: "quote_relationships",
    title: "Les relations importantes ne se contentent pas de nous accompagner : elles activent des parts profondes de nous-memes.",
    quoteOnly: true
  },
  {
    key: "trial_of_relationship",
    title: "L epreuve du lien",
    subtitle: "Ce que les relations eveillent, revelent et transforment en vous"
  },
  {
    key: "engagement_style",
    title: "Votre maniere de vous engager",
    subtitle: "Choisir, vous unir, vous reveler dans le face-a-face"
  },
  { key: "inner_base", title: "Votre base interieure", subtitle: "Securite, estime de soi, rapport a la stabilite" },
  { key: "anchors", title: "Ce qui vous ancre", subtitle: "Valeur personnelle, confort interieur, rapport au tangible" },
  {
    key: "quote_fragility",
    title: "Ce qui nous fragilise le plus est parfois aussi ce qui nous rend les plus profonds.",
    quoteOnly: true
  },
  { key: "transformation", title: "Ce qui vous transforme", subtitle: "La zone sensible, la lecon intime, la force acquise" },
  {
    key: "sensitive_point",
    title: "Votre point sensible",
    subtitle: "Ce qui vous touche, ce qui vous forme, ce qui devient une force"
  },
  {
    key: "calling",
    title: "La place qui vous appelle",
    subtitle: "Rayonnement, vocation, visibilite, accomplissement"
  },
  {
    key: "success_style",
    title: "Votre maniere de reussir",
    subtitle: "Image, ambition, contribution, influence"
  },
  { key: "distinction", title: "Ce qui vous distingue", subtitle: "Vos qualites les plus marquantes" },
  {
    key: "refinement_challenges",
    title: "Ce qui vous demande le plus de finesse",
    subtitle: "Vos zones de tension et d ajustement"
  },
  {
    key: "rebalancing",
    title: "Ce qui vous reaccorde",
    subtitle: "Vos appuis interieurs, vos gestes d equilibre, votre juste frequence"
  },
  { key: "about_reading", title: "A propos de cette lecture", subtitle: "Cadre, intention, nuances" },
  { key: "conclusion", title: "L art d etre pleinement vous", subtitle: "Conclusion personnelle" }
];

export const COMPATIBILITY_EDITORIAL_SECTION_SCHEMA: EditorialSectionShape[] = [
  {
    key: "compat_preamble",
    title: "Avant de vous lire ensemble",
    subtitle: "Une lecture sensible, a recevoir comme un reflet du lien"
  },
  {
    key: "compat_quote_presence",
    title: "Certaines relations se comprennent par les faits. D autres par l atmosphere qu elles degagent.",
    quoteOnly: true
  },
  {
    key: "compat_portrait",
    title: "L essence de votre lien",
    subtitle: "Ce que l on ressent entre vous avant meme les explications"
  },
  {
    key: "compat_presence",
    title: "Votre signature relationnelle",
    subtitle: "Le climat general de votre duo"
  },
  {
    key: "compat_quote_depth",
    title: "La verite d une relation apparait souvent dans sa maniere d accueillir l emotion.",
    quoteOnly: true
  },
  {
    key: "compat_interior",
    title: "Le paysage affectif du lien",
    subtitle: "Vos emotions, vos besoins, vos resonances profondes"
  },
  {
    key: "compat_inner_heart",
    title: "Ce qui vous rapproche en profondeur",
    subtitle: "Sensibilite, reassurance, intimite emotionnelle"
  },
  {
    key: "compat_private_self",
    title: "Ce que vous reveillez l un chez l autre",
    subtitle: "Vulnerabilite, pudeur, resonances silencieuses"
  },
  {
    key: "compat_relational_intelligence",
    title: "L intelligence du duo",
    subtitle: "Votre maniere de vous comprendre, de vous parler et de vous ajuster"
  },
  {
    key: "compat_thinking_style",
    title: "Votre langage commun",
    subtitle: "Clarte, nuance, comprehension, decalages"
  },
  {
    key: "compat_quote_voice",
    title: "La parole dans un lien ne sert pas seulement a expliquer. Elle sert aussi a rassurer, placer, reparer ou reveler.",
    quoteOnly: true
  },
  {
    key: "compat_voice_in_world",
    title: "Ce qui circule entre vous",
    subtitle: "Parole, ecoute, non-dits, verite relationnelle"
  },
  {
    key: "compat_love_art",
    title: "L art d aimer ensemble",
    subtitle: "Attachement, tendresse, desir de se choisir"
  },
  {
    key: "compat_affective_style",
    title: "Votre style relationnel",
    subtitle: "Ce que vous cherchez, ce que vous offrez, ce que vous esperez ensemble"
  },
  {
    key: "compat_quote_desire",
    title: "Le desir dans une relation ne parle pas seulement d attirance. Il dit aussi ce qui met le lien en mouvement.",
    quoteOnly: true
  },
  {
    key: "compat_desire",
    title: "Ce qui vous attire",
    subtitle: "Magnetisme, intensite, rythme du desir"
  },
  {
    key: "compat_drive_style",
    title: "Votre maniere de fonctionner a deux",
    subtitle: "Rythme, effort, quotidien, organisation"
  },
  {
    key: "compat_force_in_motion",
    title: "Votre force en mouvement",
    subtitle: "Decision, elan, tension, maniere d avancer"
  },
  {
    key: "compat_daily_elegance",
    title: "Votre elegance dans le reel",
    subtitle: "Habitudes, rythme de vie, organisation, qualite de presence"
  },
  {
    key: "compat_quote_relationships",
    title: "Les relations importantes ne se contentent pas d accompagner une vie. Elles activent des zones profondes.",
    quoteOnly: true
  },
  {
    key: "compat_trial_of_relationship",
    title: "L epreuve du face-a-face",
    subtitle: "Ce que cette relation revele, intensifie et transforme"
  },
  {
    key: "compat_engagement_style",
    title: "Votre maniere de vous rencontrer vraiment",
    subtitle: "Engagement, projection, verite du duo"
  },
  {
    key: "compat_inner_base",
    title: "Votre base commune",
    subtitle: "Securite, confiance, stabilite du lien"
  },
  {
    key: "compat_anchors",
    title: "Ce qui vous ancre ensemble",
    subtitle: "Confiance, fidelite, securite emotionnelle et concrete"
  },
  {
    key: "compat_quote_fragility",
    title: "Toute relation profonde possede un endroit plus sensible.",
    quoteOnly: true
  },
  {
    key: "compat_transformation",
    title: "Ce qui vous transforme",
    subtitle: "Fragilites, tensions, croissance du lien"
  },
  {
    key: "compat_sensitive_point",
    title: "Votre point sensible a deux",
    subtitle: "Ce qui vous touche, vous bouscule et peut vous faire grandir"
  },
  {
    key: "compat_calling",
    title: "La place que ce lien peut prendre",
    subtitle: "Potentiel, rayonnement, avenir relationnel"
  },
  {
    key: "compat_success_style",
    title: "Votre maniere de construire ensemble",
    subtitle: "Duree, complementarite, ambition du duo, influence mutuelle"
  },
  {
    key: "compat_distinction",
    title: "Ce qui vous distingue ensemble",
    subtitle: "Les qualites les plus marquantes de votre duo"
  },
  {
    key: "compat_refinement_challenges",
    title: "Ce qui vous demande le plus de finesse",
    subtitle: "Vos zones de tension et d ajustement"
  },
  {
    key: "compat_rebalancing",
    title: "Ce qui vous reaccorde",
    subtitle: "Vos appuis, vos gestes d equilibre, votre juste rythme relationnel"
  },
  {
    key: "compat_about_reading",
    title: "A propos de cette lecture",
    subtitle: "Cadre, intention, nuances"
  },
  {
    key: "compat_conclusion",
    title: "L art d habiter ce lien",
    subtitle: "Conclusion relationnelle"
  }
];

// Legacy default kept for callers that still expect a solo-first constant.
export const EDITORIAL_SECTION_SCHEMA = SOLO_EDITORIAL_SECTION_SCHEMA;

export const SOLO_TO_COMPATIBILITY_KEY: Record<SoloCanonicalSectionKey, CompatibilityCanonicalSectionKey> = {
  preamble: "compat_preamble",
  quote_presence: "compat_quote_presence",
  portrait: "compat_portrait",
  presence: "compat_presence",
  quote_depth: "compat_quote_depth",
  interior: "compat_interior",
  inner_heart: "compat_inner_heart",
  private_self: "compat_private_self",
  relational_intelligence: "compat_relational_intelligence",
  thinking_style: "compat_thinking_style",
  quote_voice: "compat_quote_voice",
  voice_in_world: "compat_voice_in_world",
  love_art: "compat_love_art",
  affective_style: "compat_affective_style",
  quote_desire: "compat_quote_desire",
  desire: "compat_desire",
  drive_style: "compat_drive_style",
  force_in_motion: "compat_force_in_motion",
  daily_elegance: "compat_daily_elegance",
  quote_relationships: "compat_quote_relationships",
  trial_of_relationship: "compat_trial_of_relationship",
  engagement_style: "compat_engagement_style",
  inner_base: "compat_inner_base",
  anchors: "compat_anchors",
  quote_fragility: "compat_quote_fragility",
  transformation: "compat_transformation",
  sensitive_point: "compat_sensitive_point",
  calling: "compat_calling",
  success_style: "compat_success_style",
  distinction: "compat_distinction",
  refinement_challenges: "compat_refinement_challenges",
  rebalancing: "compat_rebalancing",
  about_reading: "compat_about_reading",
  conclusion: "compat_conclusion"
};

export const COMPATIBILITY_TO_SOLO_KEY: Record<CompatibilityCanonicalSectionKey, SoloCanonicalSectionKey> = Object
  .entries(SOLO_TO_COMPATIBILITY_KEY)
  .reduce((acc, [solo, compatibility]) => {
    acc[compatibility as CompatibilityCanonicalSectionKey] = solo as SoloCanonicalSectionKey;
    return acc;
  }, {} as Record<CompatibilityCanonicalSectionKey, SoloCanonicalSectionKey>);

const SOLO_KEYS = new Set<SoloCanonicalSectionKey>(
  SOLO_EDITORIAL_SECTION_SCHEMA.map((section) => section.key as SoloCanonicalSectionKey)
);
const COMPATIBILITY_KEYS = new Set<CompatibilityCanonicalSectionKey>(
  COMPATIBILITY_EDITORIAL_SECTION_SCHEMA.map((section) => section.key as CompatibilityCanonicalSectionKey)
);
const ALL_KEYS = new Set<CanonicalSectionKey>([
  ...SOLO_KEYS,
  ...COMPATIBILITY_KEYS
]);

export function getEditorialSectionSchema(mode: CanonicalSchemaMode): EditorialSectionShape[] {
  return mode === "compatibility" ? COMPATIBILITY_EDITORIAL_SECTION_SCHEMA : SOLO_EDITORIAL_SECTION_SCHEMA;
}

export function isCanonicalSectionKey(
  value: string,
  mode?: CanonicalSchemaMode
): value is CanonicalSectionKey {
  if (mode === "solo") return SOLO_KEYS.has(value as SoloCanonicalSectionKey);
  if (mode === "compatibility") return COMPATIBILITY_KEYS.has(value as CompatibilityCanonicalSectionKey);
  return ALL_KEYS.has(value as CanonicalSectionKey);
}

export function resolveCanonicalSectionKey(
  value: string,
  mode: CanonicalSchemaMode,
  options?: { allowLegacy?: boolean }
): CanonicalSectionKey | null {
  const key = value.trim();
  if (!key) return null;

  if (isCanonicalSectionKey(key, mode)) return key as CanonicalSectionKey;
  if (!options?.allowLegacy) return null;

  if (mode === "compatibility" && isCanonicalSectionKey(key, "solo")) {
    return SOLO_TO_COMPATIBILITY_KEY[key as SoloCanonicalSectionKey];
  }

  if (mode === "solo" && isCanonicalSectionKey(key, "compatibility")) {
    return COMPATIBILITY_TO_SOLO_KEY[key as CompatibilityCanonicalSectionKey];
  }

  return null;
}
