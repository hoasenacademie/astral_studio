import { describe, expect, it } from "vitest";
import { dispatchEditorialPaste } from "@/lib/editorial-dispatch";
import { defaultCompatibilitySections, defaultSoloSections } from "@/lib/templates";

describe("dispatchEditorialPaste", () => {
  it("filters compatibility content when dispatching to a solo report", () => {
    const sections = defaultSoloSections();
    const pasted = [
      "L'essence de votre présence",
      "Vous avancez avec une intensité claire et personnelle.",
      "Votre style relationnel à deux repose sur des ajustements permanents entre vous."
    ].join("\n\n");

    const dispatched = dispatchEditorialPaste(pasted, sections, "solo");
    const allText = dispatched.flatMap((section) => section.bodyBlocks.map((block) => block.text)).join(" ");

    expect(allText).toContain("intensité claire et personnelle");
    expect(allText).not.toContain("style relationnel à deux");
  });

  it("filters solo content when dispatching to a compatibility report", () => {
    const sections = defaultCompatibilitySections();
    const pasted = [
      "Votre signature relationnelle",
      "Ce lien se nourrit d'écoute et de co-construction.",
      "Votre base intérieure vous pousse à avancer seule en silence."
    ].join("\n\n");

    const dispatched = dispatchEditorialPaste(pasted, sections, "compatibility");
    const allText = dispatched.flatMap((section) => section.bodyBlocks.map((block) => block.text)).join(" ");

    expect(allText).toContain("co-construction");
    expect(allText).not.toContain("avancer seule en silence");
  });

  it("supports markdown heading dispatch and keeps untouched sections", () => {
    const sections = defaultSoloSections();
    const emotional = sections.find((section) => section.id === "emotional");
    if (!emotional) throw new Error("emotional section missing in fixture");
    emotional.bodyBlocks = [{ id: "emotional_b1", text: "Contenu existant a conserver." }];

    const pasted = [
      "## Votre signature interieure :",
      "",
      "Une signature nette, elegante et exigeante.",
      "",
      "Vous avancez avec un sens aigu de la coherence."
    ].join("\n");

    const dispatched = dispatchEditorialPaste(pasted, sections, "solo");
    const overview = dispatched.find((section) => section.id === "overview");
    const emotionalAfter = dispatched.find((section) => section.id === "emotional");
    const overviewText = overview?.bodyBlocks.map((block) => block.text).join(" ") ?? "";
    const emotionalText = emotionalAfter?.bodyBlocks.map((block) => block.text).join(" ") ?? "";

    expect(overviewText).toContain("signature nette");
    expect(emotionalText).toContain("Contenu existant a conserver");
  });
});
