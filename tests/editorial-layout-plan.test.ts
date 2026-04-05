import { describe, expect, it } from "vitest";
import { createEmptyReport } from "@/lib/templates";
import { sanitizeReportDraft } from "@/lib/report-builder";
import { resolveEditorialLayoutPlan } from "@/lib/editorial-layout-plan";

describe("resolveEditorialLayoutPlan", () => {
  it("always starts with cover and signature and ends with conclusion", () => {
    const report = sanitizeReportDraft(createEmptyReport("solo"));
    const plan = resolveEditorialLayoutPlan(report);
    expect(plan[0]?.kind).toBe("cover_page");
    expect(plan[1]?.kind).toBe("signature_page");
    expect(plan[plan.length - 1]?.kind).toBe("conclusion_page");
  });

  it("injects quote pages with spacing and keeps one signature page", () => {
    const report = createEmptyReport("solo");
    report.editorialSource.sections = report.editorialSource.sections.map((section, index) => ({
      ...section,
      intro: index % 4 === 0 ? "Une phrase claire. Une tension elegante. Une presence nette." : section.intro,
      pullQuote: index % 4 === 0 ? "Une phrase claire qui porte tout le mouvement." : section.pullQuote
    }));

    const plan = resolveEditorialLayoutPlan(sanitizeReportDraft(report));
    const signaturePages = plan.filter((page) => page.kind === "signature_page");
    expect(signaturePages).toHaveLength(1);

    const quoteIndices = plan
      .map((page, index) => (page.kind === "quote_page" ? index : -1))
      .filter((value) => value >= 0);

    for (let index = 1; index < quoteIndices.length; index += 1) {
      expect(quoteIndices[index] - quoteIndices[index - 1]).toBeGreaterThanOrEqual(3);
    }
  });
});

