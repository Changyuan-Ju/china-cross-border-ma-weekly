import { describe, expect, it } from "vitest";
import { makeFingerprint, matchDealConfidence, validateDealForPublish } from "../deal-utils";
import type { Deal } from "../types";

const baseDeal = {
  canonical_deal_id: "deal-1",
  deal_fingerprint: "fp-1",
  buyer_name_cn: "Buyer",
  buyer_ticker: "000001.SZ",
  seller_names: ["Seller"],
  target_name_cn: "Target",
  deal_direction: "Outbound",
  transaction_type: "Equity acquisition",
  payment_methods: [],
  announcement_date: "2026-07-01",
  announcement_type: "initial",
  transaction_stage: "agreement_signed",
  current_status: "ongoing",
  approvals_required: [],
  closing_conditions: [],
  strategic_rationale: [],
  article_title: "Title",
  article_body: "Body",
  information_gaps: [],
  visible_tags: [],
  importance_score: 50,
  importance_score_breakdown: {},
  sources: [{ title: "Source", url: "https://example.com/a" }],
  evidence: {},
  validation_status: "valid"
} satisfies Deal;

describe("deal utilities", () => {
  it("creates stable normalized fingerprints", () => {
    expect(makeFingerprint([" Buyer ", "TARGET"])).toBe(makeFingerprint(["buyer", "target"]));
  });

  it("scores likely same deals highly", () => {
    expect(matchDealConfidence(baseDeal, { ...baseDeal, canonical_deal_id: "deal-2" })).toBeGreaterThanOrEqual(85);
  });

  it("validates required publish fields", () => {
    const errors = validateDealForPublish({ ...baseDeal, buyer_name_cn: "", sources: [] });
    expect(errors).toContain("buyer_name_required");
    expect(errors).toContain("source_required");
  });
});
