import { describe, expect, it } from "vitest";
import {
  EDITORIAL_SECTION_SCHEMA,
  COMPATIBILITY_EDITORIAL_SECTION_SCHEMA
} from "@/lib/editorial/section-schema";
import { mapParsedSectionsToEditorialSections } from "@/lib/reports/injection";
import { detectNarrativeMode, parseGptStructuredNarrative } from "@/lib/gpt-parser/parser";
import { createEmptyReport } from "@/lib/templates";

function buildMachinePayload(overrides?: Partial<Record<string, { intro?: string; body?: string; quote?: string; signature?: string }>>) {
  const blocks = EDITORIAL_SECTION_SCHEMA.map((section) => {
    const override = overrides?.[section.key] ?? {};
    const intro = override.intro ?? `Intro ${section.key}.`;
    const body = override.body ?? `Body ${section.key}.\n\nDetail ${section.key}.`;
    const quote = override.quote ?? `Quote ${section.key}.`;
    const signature = override.signature ?? `Signature ${section.key}.`;

    return [
      "===SECTION===",
      `key: ${section.key}`,
      `title: ${section.title}`,
      `subtitle: ${section.subtitle ?? ""}`,
      section.quoteOnly ? "" : "intro:\n" + intro,
      section.quoteOnly ? "" : "body:\n" + body,
      "quote:\n" + quote,
      "signature:\n" + signature,
      "===END==="
    ]
      .filter(Boolean)
      .join("\n");
  });

  return blocks.join("\n\n");
}

function buildCompatibilityMachinePayload() {
  const blocks = COMPATIBILITY_EDITORIAL_SECTION_SCHEMA.map((section) => {
    const intro = section.quoteOnly ? "" : `Intro ${section.key}.`;
    const body = section.quoteOnly ? "" : `Body ${section.key}.`;
    const quote = `Quote ${section.key}.`;
    const signature = section.quoteOnly ? "" : `Signature ${section.key}.`;

    return [
      "===SECTION===",
      `key: ${section.key}`,
      `title: ${section.title}`,
      `subtitle: ${section.subtitle ?? ""}`,
      "",
      "intro:",
      intro,
      "",
      "body:",
      body,
      "",
      "quote:",
      quote,
      "",
      "signature:",
      signature,
      "===END==="
    ].join("\n");
  });

  return blocks.join("\n\n");
}

const USER_REALISTIC_MACHINE_PAYLOAD = `
===SECTION===
key: preamble
title: Avant de commencer
subtitle: Une lecture sensible, à recevoir comme un reflet

intro:
Cette lecture propose un regard symbolique.

body:
Votre thème dessine une personnalité sobre et dense.

quote:
Voir plus clair en soi, sans jamais s’y enfermer.

signature:
Une lecture à accueillir comme un reflet vivant.
===END===

===SECTION===
key: quote_presence
title: Certaines présences se lisent d’abord dans l’impression qu’elles laissent.
subtitle: Non renseigné

intro:
Non renseigné

body:
Non renseigné

quote:
Votre présence parle avant même que vous ne parliez.

signature:
Non renseigné
===END===

===SECTION===
key: portrait
title: L’essence de votre présence
subtitle: Ce que l’on perçoit de vous avant même les mots

intro:
Votre présence mêle chaleur visible et maîtrise profonde.

body:
Dans la vie quotidienne, vous donnez l’image de quelqu’un de solide.

quote:
Vous dégagez une force calme qui ne demande pas d’effet.

signature:
Une présence noble et contenue.
===END===
`;

describe("parseGptStructuredNarrative", () => {
  it("parses a strict machine payload without structural errors", () => {
    const payload = buildMachinePayload({
      preamble: {
        intro: "Cette lecture vous invite a vous lire sans rigidite.",
        body: "Votre dynamique interieure se lit dans la nuance.",
        quote: "Une rencontre avec soi."
      }
    });

    const result = parseGptStructuredNarrative(payload);
    const preamble = result.sections.find((section) => section.key === "preamble");

    expect(result.errors).toHaveLength(0);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
    expect(preamble?.intro).toContain("sans rigidite");
    expect(preamble?.body).toContain("dynamique interieure");
    expect(preamble?.quote).toContain("rencontre avec soi");
  });

  it("blocks unknown keys", () => {
    const payload = `
===SECTION===
key: signature_interieure
title: Test
subtitle: Test
intro:
A
body:
B
quote:
C
signature:
D
===END===
`;
    const result = parseGptStructuredNarrative(payload);
    expect(result.errors.some((error) => error.code === "UNKNOWN_KEY")).toBe(true);
  });

  it("detects compatibility narrative hints", () => {
    const hint = detectNarrativeMode("Votre relation evolue ensemble. Ce duo avance grace a l ecoute entre vous deux.");
    expect(hint.mode).toBe("compatibility");
    expect(hint.compatibilityScore > hint.soloScore).toBe(true);
  });

  it("parses non-machine markdown headings as loose structured content", () => {
    const payload = [
      "## Avant de commencer",
      "",
      "Cette lecture vous propose une perspective sensible et concrete.",
      "",
      "## Votre signature interieure :",
      "",
      "Votre climat global se construit entre intensite et finesse.",
      "",
      "Vous cherchez la justesse, pas la demonstration."
    ].join("\n");

    const result = parseGptStructuredNarrative(payload);
    const preamble = result.sections.find((section) => section.key === "preamble");
    const presence = result.sections.find((section) => section.key === "presence");

    expect(result.errors).toHaveLength(0);
    expect(preamble?.intro).toContain("perspective sensible");
    expect(presence?.intro).toContain("climat global");
    expect(presence?.body).toContain("justesse");
  });

  it("accepts realistic machine payload with accents and placeholders", () => {
    const result = parseGptStructuredNarrative(USER_REALISTIC_MACHINE_PAYLOAD);
    const preamble = result.sections.find((section) => section.key === "preamble");
    const quotePresence = result.sections.find((section) => section.key === "quote_presence");
    const portrait = result.sections.find((section) => section.key === "portrait");

    expect(result.errors).toHaveLength(0);
    expect(preamble?.intro).toContain("regard symbolique");
    expect(quotePresence?.quote).toContain("présence parle");
    expect(portrait?.body).toContain("quelqu’un de solide");
  });
});

describe("mapParsedSectionsToEditorialSections", () => {
  it("injects parsed sections into solo editorial sections", () => {
    const draft = createEmptyReport("solo");
    const payload = buildMachinePayload({
      preamble: {
        intro: "Intro preambule solo.",
        body: "Body preambule solo.",
        quote: "Quote preambule solo."
      }
    });

    const parsed = parseGptStructuredNarrative(payload);
    const injected = mapParsedSectionsToEditorialSections(parsed, draft.editorialSections, "solo");
    const preface = injected.sections.find((section) => section.key === "preamble");

    expect(injected.blockingErrors).toHaveLength(0);
    expect(preface?.intro).toContain("Intro preambule solo");
    expect(preface?.body).toContain("Body preambule solo");
    expect(preface?.quote).toContain("Quote preambule solo");
  });

  it("keeps edited fields locked during reimport", () => {
    const draft = createEmptyReport("solo");
    draft.editorialSections = draft.editorialSections.map((section) =>
      section.key === "presence"
        ? {
            ...section,
            quote: "Citation retouchee manuellement.",
            edited: { ...section.edited, quote: true }
          }
        : section
    );

    const payload = buildMachinePayload({
      presence: {
        quote: "Citation GPT qui ne doit pas ecraser la retouche.",
        body: "Nouveau body presence."
      }
    });

    const parsed = parseGptStructuredNarrative(payload);
    const injected = mapParsedSectionsToEditorialSections(parsed, draft.editorialSections, "solo");
    const presence = injected.sections.find((section) => section.key === "presence");

    expect(injected.blockingErrors).toHaveLength(0);
    expect(presence?.quote).toBe("Citation retouchee manuellement.");
    expect(presence?.body).toContain("Nouveau body presence.");
  });

  it("supports compatibility canonical keys end-to-end", () => {
    const draft = createEmptyReport("compatibility");
    const payload = buildCompatibilityMachinePayload();

    const parsed = parseGptStructuredNarrative(payload, { mode: "compatibility" });
    const injected = mapParsedSectionsToEditorialSections(parsed, draft.editorialSections, "compatibility");
    const overview = injected.sections.find((section) => section.key === "compat_presence");

    expect(parsed.errors).toHaveLength(0);
    expect(injected.blockingErrors).toHaveLength(0);
    expect(overview?.body).toContain("Body compat_presence.");
  });
});
