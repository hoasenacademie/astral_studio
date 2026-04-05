import { SignKey, SignMeta } from "@/lib/types";

export const SIGNS: SignMeta[] = [
  { key: "belier", label: "Bélier", symbol: "♈", image: "/signs/belier.png" },
  { key: "taureau", label: "Taureau", symbol: "♉", image: "/signs/taureau.png" },
  { key: "gemeaux", label: "Gémeaux", symbol: "♊", image: "/signs/gemeaux.png" },
  { key: "cancer", label: "Cancer", symbol: "♋", image: "/signs/cancer.png" },
  { key: "lion", label: "Lion", symbol: "♌", image: "/signs/lion.png" },
  { key: "vierge", label: "Vierge", symbol: "♍", image: "/signs/vierge.png" },
  { key: "balance", label: "Balance", symbol: "♎", image: "/signs/balance.png" },
  { key: "scorpion", label: "Scorpion", symbol: "♏", image: "/signs/scorpion.png" },
  { key: "sagittaire", label: "Sagittaire", symbol: "♐", image: "/signs/sagittaire.png" },
  { key: "capricorne", label: "Capricorne", symbol: "♑", image: "/signs/capricorne.png" },
  { key: "verseau", label: "Verseau", symbol: "♒", image: "/signs/verseau.png" },
  { key: "poissons", label: "Poissons", symbol: "♓", image: "/signs/poissons.png" }
];

const SYMBOL_TO_KEY: Record<string, SignKey> = {
  "♈": "belier",
  "♉": "taureau",
  "♊": "gemeaux",
  "♋": "cancer",
  "♌": "lion",
  "♍": "vierge",
  "♎": "balance",
  "♏": "scorpion",
  "♐": "sagittaire",
  "♑": "capricorne",
  "♒": "verseau",
  "♓": "poissons"
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
