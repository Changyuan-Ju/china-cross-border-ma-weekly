import { describe, expect, it } from "vitest";
import { sourceMetaParts } from "../format";

describe("source metadata", () => {
  it("removes repeated Wind and unavailable-link labels", () => {
    expect(sourceMetaParts({
      title: "测试公告",
      url: "",
      publisher: "Wind公告库，公开链接未取得",
      published_at: "2026-07-10",
      source_type: "wind_record",
      link_status: "not_publicly_available"
    })).toEqual(["Wind公告库", "2026-07-10", "未取得公开链接"]);
  });
});
