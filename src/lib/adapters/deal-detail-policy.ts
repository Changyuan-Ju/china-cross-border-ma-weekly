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

export const editorialSummaryStandard = {
  language: "Simplified Chinese",
  format: "one paragraph",
  targetLength: "220-360 Chinese characters",
  hardRange: "180-450 Chinese characters",
  standardSequence: [
    "announcement date and transaction parties",
    "transaction structure, stake and consideration/payment mechanics",
    "target and buyer business context",
    "control, consolidation or completion outcome",
    "one or two transaction-specific strategic implications"
  ],
  updateSequence: [
    "original transaction background",
    "current announcement update",
    "revised deadline, condition, financing or approval status",
    "practical impact on closing or integration"
  ]
} as const;

export const detailExtractionRules = [
  "Write detailed_summary as a single Simplified Chinese editorial paragraph targeting 220-360 Chinese characters (hard range 180-450); it replaces the top-page news abstract and must not repeat a separate transaction-facts block.",
  "For an initial or completion announcement, order detailed_summary as: date and parties; structure, stake, consideration and payment; target and buyer business context; control/consolidation/completion result; one or two transaction-specific strategic implications.",
  "For an extension, financing, approval, terms change or termination update, order detailed_summary as: original transaction background; current update; revised deadline, condition, financing or approval status; practical impact on closing or integration.",
  "Do not pad detailed_summary with generic M&A language, repeat the headline, invent undisclosed facts or list information gaps; use cautious wording for company-stated rationale and keep undisclosed items in information_gaps.",
  "Extract transaction parties, signing date, announcement date, ownership before and after closing, and whether control changes.",
  "Extract target profile from official announcements only: jurisdiction, registered address, business, assets, licenses, operating footprint and subsidiaries.",
  "Extract disclosed financial metrics exactly as stated, including period, currency and metric name; do not infer undisclosed revenue, profit or valuation multiples.",
  "Extract consideration mechanics, currency, payment schedule, escrow, price adjustment, locked-box date and working-capital true-up where disclosed.",
  "Extract board, shareholder, ODI, antitrust, sector regulator and closing-condition status separately.",
  "Attach field-level evidence and source metadata; if the public URL is unavailable, mark link_status as not_publicly_available instead of fabricating a URL.",
  "When a field is material but not disclosed, add it to information_gaps rather than leaving the reader to infer completeness.",
  "Set review_required when the target asset location, buyer identity, transaction perimeter or duplicate matching confidence is uncertain."
] as const;
