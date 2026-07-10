import { describe, expect, it } from "vitest";
import { generateTags } from "../extraction";
import { dedupeTags } from "../tag-utils";

describe("tag utilities", () => {
  it("deduplicates labels after trimming and case normalization", () => {
    expect(dedupeTags([" 完成交割 ", "完成交割", "Outbound", "outbound"])).toEqual(["完成交割", "Outbound"]);
  });

  it("does not append a second payment suffix", () => {
    expect(generateTags({
      deal_direction: "境外",
      transaction_type: "股权收购",
      payment_methods: ["现金支付", "现金支付"],
      obtains_control: true,
      validation_status: "valid"
    })).toEqual(["境外", "股权收购", "现金支付", "取得控制权"]);
  });
});
