import { describe, expect, it } from "vitest";
import { detailExtractionRules, editorialSummaryStandard } from "../adapters/deal-detail-policy";

describe("editorial deal summary policy", () => {
  it("keeps the screenshot-derived length and content sequence explicit", () => {
    expect(editorialSummaryStandard.targetLength).toBe("220-360 Chinese characters");
    expect(editorialSummaryStandard.hardRange).toBe("180-450 Chinese characters");
    expect(editorialSummaryStandard.standardSequence).toHaveLength(5);
    expect(editorialSummaryStandard.updateSequence).toHaveLength(4);
  });

  it("requires one non-duplicative Chinese editorial paragraph", () => {
    expect(detailExtractionRules.join(" ")).toContain("single Simplified Chinese editorial paragraph");
    expect(detailExtractionRules.join(" ")).toContain("must not repeat a separate transaction-facts block");
  });
});
