import { describe, expect, it } from "vitest";
import { getSign, normalizeSignKey } from "@/lib/signs";

describe("sign normalization", () => {
  it("maps french names with accents", () => {
    expect(normalizeSignKey("Bélier")).toBe("belier");
    expect(normalizeSignKey("Gémeaux")).toBe("gemeaux");
  });

  it("maps english aliases", () => {
    expect(normalizeSignKey("Aries")).toBe("belier");
    expect(normalizeSignKey("Gemini")).toBe("gemeaux");
    expect(normalizeSignKey("Capricorn")).toBe("capricorne");
  });

  it("maps zodiac symbols", () => {
    expect(normalizeSignKey("♈")).toBe("belier");
    expect(normalizeSignKey("♒")).toBe("verseau");
  });

  it("resolves asset metadata from aliases", () => {
    const sign = getSign("Aries");
    expect(sign?.key).toBe("belier");
    expect(sign?.image).toBe("/signs/belier.png");
  });
});
