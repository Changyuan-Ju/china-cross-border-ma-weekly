import { describe, expect, it } from "vitest";
import { preferredSource, sourcesForButtons } from "@/components/SourceLink";

describe("source button selection", () => {
  const unavailable = { title: "Wind公告", url: "", link_status: "not_publicly_available" as const };
  const publicSource = { title: "交易所公告", url: "https://example.com/filing.pdf", link_status: "valid" as const };

  it("suppresses unavailable placeholders when a public source exists", () => {
    expect(sourcesForButtons([unavailable, publicSource])).toEqual([publicSource]);
    expect(preferredSource([unavailable, publicSource])).toEqual(publicSource);
  });

  it("keeps one unavailable status when no source can be opened", () => {
    expect(sourcesForButtons([unavailable, { ...unavailable }])).toHaveLength(1);
  });
});
