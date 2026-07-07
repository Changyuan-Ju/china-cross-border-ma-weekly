import { describe, expect, it } from "vitest";
import { rankDeals } from "../ranking";
import type { Deal } from "../types";

function deal(id: string, score: number, date: string, manual_priority?: number): Deal {
  return {
    canonical_deal_id: id,
    deal_fingerprint: id,
    buyer_name_cn: "Buyer",
    seller_names: [],
    target_name_cn: "Target",
    deal_direction: "Outbound",
    transaction_type: "Equity acquisition",
    payment_methods: [],
    announcement_date: date,
    announcement_type: "initial",
    transaction_stage: "agreement_signed",
    current_status: "ongoing",
    approvals_required: [],
    closing_conditions: [],
    strategic_rationale: [],
    article_title: id,
    article_body: id,
    information_gaps: [],
    visible_tags: [],
    importance_score: score,
    importance_score_breakdown: {},
    sources: [{ title: id, url: `https://example.com/${id}` }],
    evidence: {},
    validation_status: "valid",
    manual_priority
  };
}

describe("rankDeals", () => {
  it("sorts by manual priority, score, then date", () => {
    const ranked = rankDeals([deal("b", 90, "2026-07-01"), deal("a", 10, "2026-06-30", 1)]);
    expect(ranked.map((item) => item.canonical_deal_id)).toEqual(["a", "b"]);
  });
});
