import { describe, expect, it } from "vitest";
import { weeklyPayloadSchema } from "../schema";

describe("weekly payload schema", () => {
  it("accepts optional transaction dossier fields", () => {
    const parsed = weeklyPayloadSchema.parse({
      issue_start_date: "2026-06-27",
      issue_end_date: "2026-07-03",
      run_started_at: "2026-07-03T14:00:00.000Z",
      run_completed_at: "2026-07-03T14:08:00.000Z",
      candidate_count: 1,
      included_count: 1,
      excluded_count: 0,
      review_required_count: 0,
      deals: [
        {
          canonical_deal_id: "deal-detail-test",
          deal_fingerprint: "deal-detail-test",
          buyer_name_cn: "测试买方",
          seller_names: ["测试卖方"],
          target_name_cn: "测试标的",
          deal_direction: "中资收购境外资产",
          transaction_type: "股权收购",
          payment_methods: ["现金"],
          announcement_date: "2026-07-03",
          announcement_type: "initial",
          transaction_stage: "agreement_signed",
          current_status: "ongoing",
          approvals_required: [],
          closing_conditions: [],
          strategic_rationale: ["补充海外产能"],
          article_title: "测试买方拟收购测试标的",
          article_body: "测试正文",
          detailed_summary: "交易档案摘要",
          transaction_facts: "交易事实",
          transaction_structure: "交易结构",
          target_profile: { name: "测试标的", business: "境外制造" },
          target_financials: [{ period: "2025", metric: "EBITDA", value: "未披露" }],
          consideration_breakdown: { totalConsideration: "USD 10m" },
          pricing_basis: "经协商确定",
          approvals_and_conditions: { boardApproval: "已批准" },
          key_dates: { agreement: "2026-07-03" },
          field_evidence: { consideration: "公告披露" },
          last_verified_at: "2026-07-08T00:00:00.000Z",
          is_manual_supplement: true,
          information_gaps: ["标的收入未披露"],
          visible_tags: ["现金支付"],
          importance_score: 70,
          importance_score_breakdown: { completeness: 10 },
          sources: [{ title: "测试公告", url: "", link_status: "not_publicly_available" }],
          evidence: {},
          validation_status: "valid"
        }
      ],
      excluded_items: [],
      errors: []
    });

    expect(parsed.deals[0].target_profile?.name).toBe("测试标的");
    expect(parsed.deals[0].is_manual_supplement).toBe(true);
  });

  it("rejects Unicode replacement characters before ingestion", () => {
    const result = weeklyPayloadSchema.safeParse({
      issue_start_date: "2026-07-04",
      issue_end_date: "2026-07-10",
      run_started_at: "2026-07-10T14:00:00.000Z",
      run_completed_at: "2026-07-10T14:08:00.000Z",
      candidate_count: 1,
      included_count: 1,
      excluded_count: 0,
      review_required_count: 0,
      deals: [{
        canonical_deal_id: "deal-corrupt-text",
        deal_fingerprint: "deal-corrupt-text",
        buyer_name_cn: "测试买方",
        seller_names: ["Kaja M�hling"],
        target_name_cn: "测试标的",
        deal_direction: "中资收购境外资产",
        transaction_type: "股权收购",
        payment_methods: ["现金"],
        announcement_date: "2026-07-10",
        announcement_type: "initial",
        transaction_stage: "agreement_signed",
        current_status: "ongoing",
        approvals_required: [],
        closing_conditions: [],
        strategic_rationale: [],
        article_title: "测试交易",
        article_body: "测试正文",
        information_gaps: [],
        visible_tags: [],
        importance_score: 50,
        importance_score_breakdown: {},
        sources: [{ title: "测试公告", url: "", link_status: "not_publicly_available" }],
        evidence: {},
        validation_status: "valid"
      }],
      excluded_items: [],
      errors: []
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["deals", 0, "seller_names", 0]);
  });
});
