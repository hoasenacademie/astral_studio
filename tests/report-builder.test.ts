import { describe, expect, it } from "vitest";
import { sanitizeReportDraft } from "@/lib/report-builder";
import { createEmptyReport } from "@/lib/templates";

describe("sanitizeReportDraft", () => {
  it("removes compatibility payload from a solo draft", () => {
    const draft = createEmptyReport("solo");
    draft.rawInputB = "Soleil 10°10' Cancer";
    draft.subjects = {
      ...draft.subjects,
      personA: {
        firstName: "A",
        birthDate: "",
        birthTime: "",
        birthPlace: "",
        signPrimary: "",
        signSymbol: "",
        signImage: ""
      }
    };

    const sanitized = sanitizeReportDraft(draft);
    expect(sanitized.mode).toBe("solo");
    expect(sanitized.rawInputB).toBe("");
    expect(sanitized.parsedB).toBeUndefined();
    expect(sanitized.subjects.personA).toBeUndefined();
  });

  it("keeps canonical editorialSections synced with editorialSource", () => {
    const draft = createEmptyReport("solo");
    const target = draft.editorialSource.sections.find((section) => section.id === "overview");
    if (!target) throw new Error("overview section missing in fixture");
    target.intro = "Intro overview";
    target.bodyBlocks = [{ id: "overview_b1", text: "Body overview" }];
    target.pullQuote = "Quote overview";
    target.signatureBox = { label: "En une phrase", text: "Signature overview" };

    const sanitized = sanitizeReportDraft(draft);
    const structured = sanitized.editorialSections.find((section) => section.key === "presence");

    expect(structured).toBeDefined();
    expect(structured?.intro).toContain("Intro overview");
    expect(structured?.body).toContain("Body overview");
    expect(structured?.quote).toContain("Quote overview");
    expect(structured?.signature).toContain("Signature overview");
  });

  it("persists edited flags between source and structured sections", () => {
    const draft = createEmptyReport("solo");
    const target = draft.editorialSource.sections.find((section) => section.id === "overview");
    if (!target) throw new Error("overview section missing in fixture");

    target.intro = "Intro retouchee";
    target.pullQuote = "Citation retouchee";
    target.edited = { intro: true, quote: true };

    const sanitized = sanitizeReportDraft(draft);
    const source = sanitized.editorialSource.sections.find((section) => section.id === "overview");
    const structured = sanitized.editorialSections.find((section) => section.key === "presence");

    expect(source?.edited?.intro).toBe(true);
    expect(source?.edited?.quote).toBe(true);
    expect(structured?.edited?.intro).toBe(true);
    expect(structured?.edited?.quote).toBe(true);
  });
});
