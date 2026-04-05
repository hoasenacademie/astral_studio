import { ParsedChart } from "@/lib/types";
import { getSign } from "@/lib/signs";

function normalizeSpaces(input: string) {
  return input.replace(/\r/g, "").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ").trim();
}

function parseDegree(text: string) {
  const match = text.match(/(\d{1,2})\s*(?:°|º|Â°|Âº)\s*(\d{1,2})\s*(?:['’]|â€™)?/);
  return match ? { degree: Number(match[1]), minute: Number(match[2]) } : { degree: null, minute: null };
}

export function parseAstroText(raw: string): ParsedChart {
  const text = normalizeSpaces(raw);
  if (!text) {
    return {
      positions: [],
      houses: [],
      aspects: [],
      settings: [],
      warnings: ["Aucune donnée importée."],
      confidence: 0
    };
  }

  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const positions: ParsedChart["positions"] = [];
  const houses: ParsedChart["houses"] = [];
  const aspects: ParsedChart["aspects"] = [];
  const settings: ParsedChart["settings"] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    const planetMatch = line.match(
      /^([A-Za-zÀ-ÿœŒ' -]+)\s+(\d{1,2}\s*(?:°|º|Â°|Âº)\s*\d{1,2}\s*(?:['’]|â€™)?)\s+([A-Za-zÀ-ÿœŒ-]+)(.*)$/i
    );
    const houseMatch = line.match(
      /^(Maison\s+\d{1,2}|AS|MC)\s+(\d{1,2}\s*(?:°|º|Â°|Âº)\s*\d{1,2}\s*(?:['’]|â€™)?)\s+([A-Za-zÀ-ÿœŒ-]+)/i
    );
    const aspectMatch = line.match(
      /^([A-Za-zÀ-ÿœŒ' -]+)\s+(Conjonction|Opposition|Carré|CarrÃ©|Trine|Trigone|Sextile|Quinconce)\s+([A-Za-zÀ-ÿœŒ' -]+)(?:\s+Orbe\s+([0-9°ºÂ°'’â€™]+))?/i
    );

    if (aspectMatch) {
      aspects.push({
        from: aspectMatch[1].trim(),
        type: aspectMatch[2].trim(),
        to: aspectMatch[3].trim(),
        orb: aspectMatch[4] ?? null
      });
      continue;
    }

    if (houseMatch) {
      const { degree, minute } = parseDegree(houseMatch[2]);
      const rawSign = houseMatch[3].trim();
      const sign = getSign(rawSign)?.label ?? rawSign;
      houses.push({ label: houseMatch[1].trim(), sign, degree, minute });
      continue;
    }

    if (planetMatch) {
      const rawSign = planetMatch[3].trim();
      const sign = getSign(rawSign);
      if (!sign) continue;

      const { degree, minute } = parseDegree(planetMatch[2]);
      positions.push({
        label: planetMatch[1].trim(),
        sign: sign.label,
        degree,
        minute,
        retrograde: /(?:\bR\b|\bRx\b|Я|Ð¯)/i.test(planetMatch[4] ?? ""),
        house: null
      });
      continue;
    }

    if (/tropical|sidéral|sidÃ©ral|sidereal|placidus|maisons|n[oœ]ud|n[oÅ“]ud|lilith|domification/i.test(line)) {
      const label = line.split(/[:\-]/)[0]?.trim() || "Paramètre";
      settings.push({ label, value: line });
      continue;
    }
  }

  if (!positions.length) warnings.push("Aucune position planétaire n’a été reconnue.");
  if (!houses.length) warnings.push("Aucune cuspide de maison n’a été reconnue.");
  if (!aspects.length) warnings.push("Aucun aspect n’a été reconnu.");

  const confidence = Math.max(
    10,
    Math.min(98, positions.length * 6 + houses.length * 3 + aspects.length * 2 + settings.length * 4)
  );

  return { positions, houses, aspects, settings, warnings, confidence };
}
