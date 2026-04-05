
import { ParsedChart } from "@/lib/types";
import { getSign } from "@/lib/signs";

export type SignaturePointKey = "sun" | "moon" | "ascendant" | "midheaven";
export type SignaturePoint = {
  key: SignaturePointKey;
  label: string;
  sign: string | null;
  asset: ReturnType<typeof getSign>;
};

function normalizeLabel(input?: string | null): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchAliases(label: string, aliases: string[]) {
  const target = normalizeLabel(label);
  return aliases.some((alias) => normalizeLabel(alias) === target);
}

function findPositionSign(chart: ParsedChart | undefined, aliases: string[]): string | null {
  if (!chart) return null;
  const found = chart.positions.find((position) => matchAliases(position.label, aliases));
  return found?.sign?.trim() || null;
}

function findHouseLikeSign(chart: ParsedChart | undefined, aliases: string[]): string | null {
  if (!chart) return null;
  const foundHouse = chart.houses.find((house) => matchAliases(house.label, aliases));
  if (foundHouse?.sign?.trim()) return foundHouse.sign.trim();
  const foundPosition = chart.positions.find((position) => matchAliases(position.label, aliases));
  return foundPosition?.sign?.trim() || null;
}

export function getChartSignaturePoints(chart?: ParsedChart): SignaturePoint[] {
  const sunSign = findPositionSign(chart, ["Soleil", "Sun"]);
  const moonSign = findPositionSign(chart, ["Lune", "Moon"]);
  const ascSign = findHouseLikeSign(chart, ["AS", "Asc", "Ascendant", "Maison 1", "House 1"]);
  const mcSign = findHouseLikeSign(chart, ["MC", "Milieu du Ciel", "Midheaven", "Maison 10", "House 10"]);

  return [
    { key: "sun", label: "Soleil", sign: sunSign, asset: getSign(sunSign) },
    { key: "moon", label: "Lune", sign: moonSign, asset: getSign(moonSign) },
    { key: "ascendant", label: "Ascendant", sign: ascSign, asset: getSign(ascSign) },
    { key: "midheaven", label: "Milieu du Ciel", sign: mcSign, asset: getSign(mcSign) }
  ];
}
