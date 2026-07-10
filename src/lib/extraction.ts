import type { Deal } from "./types";
import { dedupeTags, paymentMethodTag } from "./tag-utils";

export type RawCandidate = {
  title: string;
  announcement_date: string;
  source_url: string;
  publisher?: string;
  buyer_name_cn?: string;
  buyer_ticker?: string;
  seller_names?: string[];
  target_name_cn?: string;
  target_country_or_region?: string;
  target_industry?: string;
  target_business?: string;
  deal_direction?: string;
  transaction_type?: string;
  consideration_text?: string;
  payment_methods?: string[];
  body?: string;
};

export function classifyStage(text: string) {
  const source = text.toLowerCase();
  if (source.includes("terminated") || text.includes("终止")) return "terminated";
  if (source.includes("completed") || text.includes("完成交割")) return "completed";
  if (source.includes("extended") || text.includes("延长")) return "extended";
  if (text.includes("监管") || text.includes("审批")) return "regulatory_review";
  if (text.includes("签署") || source.includes("agreement")) return "agreement_signed";
  return "unknown";
}

export function classifyAnnouncementType(stage: string) {
  if (stage === "unknown" || stage === "agreement_signed") return "initial";
  return "update";
}

export function generateTags(deal: Pick<Deal, "deal_direction" | "transaction_type" | "payment_methods" | "obtains_control" | "validation_status">) {
  return dedupeTags([
    deal.deal_direction,
    deal.transaction_type,
    ...deal.payment_methods.map(paymentMethodTag),
    deal.obtains_control ? "取得控制权" : null,
    deal.validation_status === "review_required" ? "需要复核" : null
  ]);
}

export function scoreImportance(deal: Pick<Deal, "consideration_amount" | "obtains_control" | "transaction_stage" | "sources" | "information_gaps">) {
  const size = deal.consideration_amount ? Math.min(25, Math.ceil(Math.log10(Math.max(deal.consideration_amount, 1)) * 3)) : 0;
  const control = deal.obtains_control ? 20 : 5;
  const stage = ["completed", "agreement_signed", "terminated"].includes(deal.transaction_stage) ? 15 : 8;
  const completeness = Math.max(0, 20 - deal.information_gaps.length * 4);
  const source = deal.sources.length ? 10 : 0;
  const breakdown = { size, control, classification: 10, operating_substance: 10, stage, completeness: completeness + source };
  return { score: Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)), breakdown };
}
