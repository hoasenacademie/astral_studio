import { describe, expect, it } from "vitest";
import { parseAstroText } from "@/lib/parser";

describe("parseAstroText", () => {
  it("extracts positions, houses and aspects", () => {
    const parsed = parseAstroText(`
      Soleil 26°43' Balance
      Maison 1 19°46' Bélier
      Soleil Conjonction Pluton Orbe 2°38'
      Thème tropical Domification Placidus
    `);

    expect(parsed.positions.length).toBeGreaterThan(0);
    expect(parsed.houses.length).toBeGreaterThan(0);
    expect(parsed.aspects.length).toBeGreaterThan(0);
    expect(parsed.settings.length).toBeGreaterThan(0);
  });

  it("parses english sign names and canonicalizes them", () => {
    const parsed = parseAstroText(`
      Sun 14°30' Aries
      Moon 09°11' Gemini
      AS 19°46' Libra
      MC 02°10' Capricorn
    `);

    expect(parsed.positions.find((item) => item.label === "Sun")?.sign).toBe("Bélier");
    expect(parsed.positions.find((item) => item.label === "Moon")?.sign).toBe("Gémeaux");
    expect(parsed.houses.find((item) => item.label === "AS")?.sign).toBe("Balance");
    expect(parsed.houses.find((item) => item.label === "MC")?.sign).toBe("Capricorne");
  });
});
