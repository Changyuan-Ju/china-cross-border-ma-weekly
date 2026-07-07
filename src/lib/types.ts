export type ValidationStatus = "valid" | "review_required" | "rejected";

export type DealSource = {
  title: string;
  url: string;
  publisher?: string;
  published_at?: string;
  source_type?: string;
  is_primary?: boolean;
  link_status?: "valid" | "broken" | "replaced" | "inaccessible" | "not_publicly_available";
  last_verified_at?: string;
  wind_record_id?: string;
};

export type Deal = {
  canonical_deal_id: string;
  deal_fingerprint: string;
  buyer_name_cn: string;
  buyer_name_en?: string | null;
  buyer_ticker?: string | null;
  seller_names: string[];
  target_name_cn: string;
  target_name_en?: string | null;
  target_country_or_region?: string | null;
  target_primary_asset_location?: string | null;
  target_industry?: string | null;
  target_business?: string | null;
  deal_direction: string;
  transaction_type: string;
  stake_before?: number | null;
  stake_change?: number | null;
  stake_after?: number | null;
  obtains_control?: boolean | null;
  consideration_amount?: number | null;
  consideration_currency?: string | null;
  consideration_text?: string | null;
  payment_methods: string[];
  announcement_date: string;
  agreement_date?: string | null;
  announcement_type: string;
  transaction_stage: string;
  current_status: string;
  expected_closing_date?: string | null;
  actual_closing_date?: string | null;
  approvals_required: string[];
  closing_conditions: string[];
  strategic_rationale: string[];
  article_title: string;
  article_body: string;
  information_gaps: string[];
  visible_tags: string[];
  importance_score: number;
  importance_score_breakdown: Record<string, number>;
  sources: DealSource[];
  evidence: Record<string, string>;
  validation_status: ValidationStatus;
  manual_priority?: number | null;
};

export type ExcludedItem = {
  candidate_name: string;
  buyer_name?: string;
  buyer_ticker?: string;
  target_name?: string;
  announcement_date?: string;
  announcement_title: string;
  source?: string;
  source_url?: string;
  source_title?: string;
  link_status?: "valid" | "broken" | "replaced" | "inaccessible" | "not_publicly_available";
  information_gaps?: string[];
  wind_record_id?: string;
  exclusion_reason: string;
  may_reconsider: boolean;
};

export type CandidateItem = {
  id: string;
  issue_id: string;
  status: "review_required" | "excluded";
  candidate_title: string;
  buyer_name?: string | null;
  buyer_ticker?: string | null;
  target_name?: string | null;
  announcement_date?: string | null;
  current_status: string;
  reason: string;
  information_gaps: string[];
  original_title: string;
  source_title?: string | null;
  source_url?: string | null;
  source_publisher?: string | null;
  link_status: string;
};

export type WeeklyPayload = {
  issue_start_date: string;
  issue_end_date: string;
  run_started_at: string;
  run_completed_at: string;
  candidate_count: number;
  included_count: number;
  excluded_count: number;
  review_required_count: number;
  deals: Deal[];
  excluded_items: ExcludedItem[];
  errors: string[];
};

export type Store = {
  site: {
    name: string;
    editor: string;
    updated_at: string;
  };
  issues: Array<{
    id: string;
    start_date: string;
    end_date: string;
    title: string;
    summary: string;
    deal_ids: string[];
    candidate_count: number;
    included_count: number;
    excluded_count: number;
    review_required_count: number;
    published_at: string;
  }>;
  deals: Deal[];
  runs: Array<WeeklyPayload & { id: string; status: string }>;
};
