import { SignKey, SignMeta } from "@/lib/types";

const SYMBOLS = {
  belier: "\u2648",
  taureau: "\u2649",
  gemeaux: "\u264A",
  cancer: "\u264B",
  lion: "\u264C",
  vierge: "\u264D",
  balance: "\u264E",
  scorpion: "\u264F",
  sagittaire: "\u2650",
  capricorne: "\u2651",
  verseau: "\u2652",
  poissons: "\u2653"
} as const;

export const SIGNS: SignMeta[] = [
  { key: "belier", label: "Bélier", symbol: SYMBOLS.belier, image: "/signs/belier.png" },
  { key: "taureau", label: "Taureau", symbol: SYMBOLS.taureau, image: "/signs/taureau.png" },
  { key: "gemeaux", label: "Gémeaux", symbol: SYMBOLS.gemeaux, image: "/signs/gemeaux.png" },
  { key: "cancer", label: "Cancer", symbol: SYMBOLS.cancer, image: "/signs/cancer.png" },
  { key: "lion", label: "Lion", symbol: SYMBOLS.lion, image: "/signs/lion.png" },
  { key: "vierge", label: "Vierge", symbol: SYMBOLS.vierge, image: "/signs/vierge.png" },
  { key: "balance", label: "Balance", symbol: SYMBOLS.balance, image: "/signs/balance.png" },
  { key: "scorpion", label: "Scorpion", symbol: SYMBOLS.scorpion, image: "/signs/scorpion.png" },
  { key: "sagittaire", label: "Sagittaire", symbol: SYMBOLS.sagittaire, image: "/signs/sagittaire.png" },
  { key: "capricorne", label: "Capricorne", symbol: SYMBOLS.capricorne, image: "/signs/capricorne.png" },
  { key: "verseau", label: "Verseau", symbol: SYMBOLS.verseau, image: "/signs/verseau.png" },
  { key: "poissons", label: "Poissons", symbol: SYMBOLS.poissons, image: "/signs/poissons.png" }
];

const SYMBOL_TO_KEY: Record<string, SignKey> = {
  [SYMBOLS.belier]: "belier",
  [SYMBOLS.taureau]: "taureau",
  [SYMBOLS.gemeaux]: "gemeaux",
  [SYMBOLS.cancer]: "cancer",
  [SYMBOLS.lion]: "lion",
  [SYMBOLS.vierge]: "vierge",
  [SYMBOLS.balance]: "balance",
  [SYMBOLS.scorpion]: "scorpion",
  [SYMBOLS.sagittaire]: "sagittaire",
  [SYMBOLS.capricorne]: "capricorne",
  [SYMBOLS.verseau]: "verseau",
  [SYMBOLS.poissons]: "poissons"
};

const ALIAS_TO_KEY: Record<string, SignKey> = {
  belier: "belier",
  balier: "belier",
  aries: "belier",
  taureau: "taureau",
  taurus: "taureau",
  gemeaux: "gemeaux",
  gameaux: "gemeaux",
  gemini: "gemeaux",
  cancer: "cancer",
  lion: "lion",
  leo: "lion",
  vierge: "vierge",
  virgo: "vierge",
  balance: "balance",
  libra: "balance",
  scorpion: "scorpion",
  scorpio: "scorpion",
  sagittaire: "sagittaire",
  sagittarius: "sagittaire",
  capricorne: "capricorne",
  capricorn: "capricorne",
  verseau: "verseau",
  aquarius: "verseau",
  poissons: "poissons",
  pisces: "poissons"
};

function normalizeToken(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function normalizeSignKey(input?: string | null): SignKey | null {
  if (!input) return null;

  for (const symbol of Object.keys(SYMBOL_TO_KEY)) {
    if (input.includes(symbol)) return SYMBOL_TO_KEY[symbol];
  }

  const normalized = normalizeToken(input);
  if (!normalized) return null;

  const direct = SIGNS.find((item) => item.key === normalized)?.key;
  if (direct) return direct;

  return ALIAS_TO_KEY[normalized] ?? null;
}

export function getSign(sign: SignKey | "" | string | null | undefined) {
  const key = normalizeSignKey(sign ?? "");
  return key ? SIGNS.find((item) => item.key === key) ?? null : null;
}
