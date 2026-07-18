import { describe, expect, it } from "vitest";
import { normalizeIndustry, normalizeRegion } from "@/lib/teasers/taxonomy";

describe("teaser taxonomy", () => {
  it("collapses regions into the six approved categories", () => {
    expect(normalizeRegion("北美洲")).toBe("北美");
    expect(normalizeRegion("拉丁美洲")).toBe("拉美");
    expect(normalizeRegion("东南亚")).toBe("亚洲");
    expect(normalizeRegion("南亚")).toBe("亚洲");
    expect(normalizeRegion("全球")).toBeNull();
  });

  it("maps detailed industries into broad institutional categories", () => {
    expect(normalizeIndustry("半导体")).toBe("TMT");
    expect(normalizeIndustry("矿业与金属")).toBe("能源矿产");
    expect(normalizeIndustry("汽车零部件")).toBe("工业");
    expect(normalizeIndustry("医疗器械")).toBe("医疗健康");
    expect(normalizeIndustry("物流与供应链")).toBe("物流运输");
  });
});
