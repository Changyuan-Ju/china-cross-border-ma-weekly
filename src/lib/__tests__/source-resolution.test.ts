import { describe, expect, it } from "vitest";
import { isSearchResultSource, validateSources } from "../source-resolution";

describe("source resolution", () => {
  it("rejects search-result URLs as stored announcement sources", () => {
    const url = "https://www.cninfo.com.cn/new/fulltextSearch?keyWord=300793";
    expect(isSearchResultSource(url)).toBe(true);
    expect(validateSources([{ title: "公告", url }])).toContain(`search_result_source_not_allowed:${url}`);
  });

  it("accepts a direct public announcement PDF", () => {
    const url = "https://static.cninfo.com.cn/finalpage/2026-07-03/1225409617.PDF";
    expect(isSearchResultSource(url)).toBe(false);
    expect(validateSources([{ title: "公告", url }])).toEqual([]);
  });
});
