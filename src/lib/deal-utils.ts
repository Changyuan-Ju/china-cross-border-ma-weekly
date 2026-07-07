import crypto from "node:crypto";
import { validateSources } from "./source-resolution";
import type { Deal } from "./types";

export function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function makeFingerprint(parts: Array<string | null | undefined>) {
  const normalized = parts.map(normalizeText).filter(Boolean).join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

export function makeDealFingerprint(deal: Pick<Deal, "buyer_ticker" | "buyer_name_cn" | "target_name_cn" | "deal_direction" | "seller_names">) {
  return makeFingerprint([deal.buyer_ticker, deal.buyer_name_cn, deal.target_name_cn, deal.deal_direction, deal.seller_names.join(";")]);
}

export function makeSourceFingerprint(url: string, title: string, date?: string) {
  return makeFingerprint([url, title, date]);
}

export function matchDealConfidence(candidate: Deal, existing: Deal) {
  let score = 0;
  if (normalizeText(candidate.deal_fingerprint) === normalizeText(existing.deal_fingerprint)) score += 60;
  if (candidate.buyer_ticker && normalizeText(candidate.buyer_ticker) === normalizeText(existing.buyer_ticker)) score += 15;
  if (normalizeText(candidate.target_name_cn) === normalizeText(existing.target_name_cn)) score += 15;
  if (normalizeText(candidate.deal_direction) === normalizeText(existing.deal_direction)) score += 5;
  if (candidate.seller_names.some((seller) => existing.seller_names.map(normalizeText).includes(normalizeText(seller)))) score += 5;
  return Math.min(score, 100);
}

export function shouldAutoMerge(candidate: Deal, existing: Deal) {
  return matchDealConfidence(candidate, existing) >= 85;
}

export function validateDealForPublish(deal: Deal) {
  const errors: string[] = [];
  if (!deal.buyer_name_cn) errors.push("buyer_name_required");
  if (!deal.target_name_cn) errors.push("target_name_required");
  if (!deal.announcement_date) errors.push("announcement_date_required");
  if (!deal.sources.length) errors.push("source_required");
  errors.push(...validateSources(deal.sources));
  for (const field of ["stake_before", "stake_change", "stake_after"] as const) {
    const value = deal[field];
    if (typeof value === "number" && (value < 0 || value > 100)) errors.push(`${field}_out_of_range`);
  }
  if (deal.transaction_stage === "completed" && !deal.evidence.completed) errors.push("completed_stage_requires_evidence");
  if (deal.transaction_stage === "terminated" && !deal.evidence.terminated) errors.push("terminated_stage_requires_evidence");
  return errors;
}
