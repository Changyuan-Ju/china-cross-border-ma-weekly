export const detailProfileFields = [
  "detailed_summary",
  "transaction_facts",
  "transaction_structure",
  "target_profile",
  "target_financials",
  "consideration_breakdown",
  "pricing_basis",
  "strategic_rationale",
  "approvals_and_conditions",
  "key_dates",
  "information_gaps",
  "field_evidence",
  "last_verified_at"
] as const;

export const detailExtractionRules = [
  "Extract transaction parties, signing date, announcement date, ownership before and after closing, and whether control changes.",
  "Extract target profile from official announcements only: jurisdiction, registered address, business, assets, licenses, operating footprint and subsidiaries.",
  "Extract disclosed financial metrics exactly as stated, including period, currency and metric name; do not infer undisclosed revenue, profit or valuation multiples.",
  "Extract consideration mechanics, currency, payment schedule, escrow, price adjustment, locked-box date and working-capital true-up where disclosed.",
  "Extract board, shareholder, ODI, antitrust, sector regulator and closing-condition status separately.",
  "Attach field-level evidence and source metadata; if the public URL is unavailable, mark link_status as not_publicly_available instead of fabricating a URL.",
  "When a field is material but not disclosed, add it to information_gaps rather than leaving the reader to infer completeness.",
  "Set review_required when the target asset location, buyer identity, transaction perimeter or duplicate matching confidence is uncertain."
] as const;
