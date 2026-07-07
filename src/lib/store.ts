import { promises as fs } from "node:fs";
import type { Prisma } from "@prisma/client";
import path from "node:path";
import { hasDatabaseUrl, prisma } from "./db";
import type { Deal, Store, WeeklyPayload } from "./types";
import { rankDeals } from "./ranking";

const DATA_PATH = path.resolve(process.cwd(), process.env.LOCAL_DATA_PATH ?? "data/store.json");

const emptyStore: Store = {
  site: {
    name: "Cross-border M&A Weekly",
    editor: "Changyuan Ju",
    updated_at: new Date().toISOString()
  },
  issues: [],
  deals: [],
  runs: []
};

async function ensureFile() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify(emptyStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<Store> {
  if (hasDatabaseUrl()) return readDatabaseStore();
  await ensureFile();
  const store = JSON.parse(await fs.readFile(DATA_PATH, "utf8")) as Store;
  return { ...store, deals: store.deals.filter((deal) => deal.validation_status === "valid") };
}

export async function writeStore(store: Store) {
  await ensureFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function upsertWeeklyPayload(payload: WeeklyPayload) {
  const store = await readStore();
  const validDeals = payload.deals.filter((deal) => deal.validation_status === "valid");
  const reviewDeals = payload.deals.filter((deal) => deal.validation_status === "review_required");
  const acceptedDeals = [...validDeals, ...reviewDeals];

  for (const deal of acceptedDeals) {
    const existingIndex = store.deals.findIndex(
      (current) => current.deal_fingerprint === deal.deal_fingerprint || current.canonical_deal_id === deal.canonical_deal_id
    );
    if (existingIndex >= 0) store.deals[existingIndex] = mergeDeal(store.deals[existingIndex], deal);
    else store.deals.push(deal);
  }

  const issueId = `${payload.issue_start_date}-to-${payload.issue_end_date}`;
  const issue = {
    id: issueId,
    start_date: payload.issue_start_date,
    end_date: payload.issue_end_date,
    title: `${payload.issue_start_date} to ${payload.issue_end_date} Cross-border M&A Weekly`,
    summary: `Included ${payload.included_count} deal(s); ${payload.review_required_count} item(s) require review.`,
    deal_ids: rankDeals(validDeals).map((deal) => deal.canonical_deal_id),
    candidate_count: payload.candidate_count,
    included_count: payload.included_count,
    excluded_count: payload.excluded_count,
    review_required_count: payload.review_required_count,
    published_at: payload.run_completed_at
  };

  const issueIndex = store.issues.findIndex((item) => item.id === issueId);
  if (issueIndex >= 0) store.issues[issueIndex] = issue;
  else store.issues.push(issue);

  store.runs.unshift({ ...payload, id: `run-${payload.run_started_at}`, status: payload.errors.length ? "completed_with_errors" : "completed" });
  store.site.updated_at = new Date().toISOString();
  store.issues.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  store.deals = rankDeals(store.deals);
  await writeStore(store);
  return { issueId, accepted: acceptedDeals.length };
}

function mergeDeal(previous: Deal, next: Deal): Deal {
  return {
    ...previous,
    ...next,
    information_gaps: Array.from(new Set([...previous.information_gaps, ...next.information_gaps])),
    visible_tags: Array.from(new Set([...previous.visible_tags, ...next.visible_tags])),
    sources: Array.from(new Map([...previous.sources, ...next.sources].map((source) => [source.url, source])).values()),
    importance_score: Math.max(previous.importance_score, next.importance_score)
  };
}

async function readDatabaseStore(): Promise<Store> {
  const [deals, issues, runs] = await Promise.all([
    prisma.deal.findMany({
      where: { validationStatus: "valid" },
      include: { sources: true, events: { include: { sourceLinks: true }, orderBy: { announcementDate: "asc" } } },
      orderBy: [{ manualPriority: "asc" }, { importanceScore: "desc" }, { latestAnnouncementDate: "desc" }]
    }),
    prisma.weeklyIssue.findMany({ orderBy: { endDate: "desc" } }),
    prisma.ingestionRun.findMany({ orderBy: { runStartedAt: "desc" }, take: 50 })
  ]);

  type DealWithSources = Prisma.DealGetPayload<{ include: { sources: true; events: { include: { sourceLinks: true } } } }>;
  type IssueRow = Prisma.WeeklyIssueGetPayload<object>;
  type RunRow = Prisma.IngestionRunGetPayload<object>;

  return {
    site: { name: "Cross-border M&A Weekly", editor: "Changyuan Ju", updated_at: new Date().toISOString() },
    issues: (issues as IssueRow[]).map((issue) => ({
      id: issue.id,
      start_date: issue.startDate.toISOString().slice(0, 10),
      end_date: issue.endDate.toISOString().slice(0, 10),
      title: issue.title,
      summary: issue.summary,
      deal_ids: issue.dealIds,
      candidate_count: issue.candidateCount,
      included_count: issue.includedCount,
      excluded_count: issue.excludedCount,
      review_required_count: issue.reviewRequiredCount,
      published_at: issue.publishedAt?.toISOString() ?? issue.updatedAt.toISOString()
    })),
    deals: (deals as DealWithSources[]).map((deal) => ({
      canonical_deal_id: deal.id,
      deal_fingerprint: deal.fingerprint,
      buyer_name_cn: deal.buyerNameCn,
      buyer_name_en: deal.buyerNameEn,
      buyer_ticker: deal.buyerTicker,
      seller_names: deal.sellerNames,
      target_name_cn: deal.targetNameCn,
      target_name_en: deal.targetNameEn,
      target_country_or_region: deal.targetCountry,
      target_primary_asset_location: deal.targetAssetLocation,
      target_industry: deal.targetIndustry,
      target_business: deal.targetBusiness,
      deal_direction: deal.dealDirection,
      transaction_type: deal.transactionType,
      stake_before: deal.stakeBefore,
      stake_change: deal.stakeChange,
      stake_after: deal.stakeAfter,
      obtains_control: deal.obtainsControl,
      consideration_amount: deal.considerationAmount,
      consideration_currency: deal.considerationCurrency,
      consideration_text: deal.considerationText,
      payment_methods: deal.paymentMethods,
      announcement_date: deal.latestAnnouncementDate.toISOString().slice(0, 10),
      announcement_type: "update",
      transaction_stage: deal.currentStage,
      current_status: deal.currentStatus,
      approvals_required: [],
      closing_conditions: [],
      strategic_rationale: [],
      article_title: deal.articleTitle,
      article_body: deal.articleBody,
      detailed_summary: deal.detailedSummary,
      transaction_facts: deal.transactionFacts,
      transaction_structure: deal.transactionStructure,
      target_profile: deal.targetProfile as Deal["target_profile"],
      target_financials: deal.targetFinancials as Deal["target_financials"],
      consideration_breakdown: deal.considerationBreakdown as Deal["consideration_breakdown"],
      pricing_basis: deal.pricingBasis,
      approvals_and_conditions: deal.approvalsAndConditions as Deal["approvals_and_conditions"],
      key_dates: deal.keyDates as Deal["key_dates"],
      field_evidence: deal.fieldEvidence as Deal["field_evidence"],
      last_verified_at: deal.lastVerifiedAt?.toISOString(),
      is_manual_supplement: deal.isManualSupplement,
      information_gaps: deal.informationGaps,
      visible_tags: deal.visibleTags,
      importance_score: deal.importanceScore,
      importance_score_breakdown: deal.importanceBreakdown as Record<string, number>,
      sources: deal.sources.map((source) => ({
        title: source.title,
        url: source.url,
        publisher: source.publisher ?? undefined,
        published_at: source.publishedAt?.toISOString().slice(0, 10),
        source_type: source.sourceType,
        is_primary: source.isPrimary,
        link_status: source.linkStatus as Deal["sources"][number]["link_status"],
        last_verified_at: source.lastVerifiedAt?.toISOString(),
        wind_record_id: source.windRecordId ?? undefined
      })),
      evidence: {},
      validation_status: deal.validationStatus as Deal["validation_status"],
      manual_priority: deal.manualPriority,
      events: deal.events.map((event) => ({
        id: event.id,
        announcement_date: event.announcementDate.toISOString().slice(0, 10),
        announcement_type: event.announcementType,
        transaction_stage: event.transactionStage,
        title: event.title,
        body: event.body,
        source_fingerprint: event.sourceFingerprint,
        evidence: event.evidence as Record<string, unknown>,
        sources: event.sourceLinks.map((source) => ({
          title: source.title,
          url: source.url,
          publisher: source.publisher ?? undefined,
          published_at: source.publishedAt?.toISOString().slice(0, 10),
          source_type: source.sourceType,
          is_primary: source.isPrimary,
          link_status: source.linkStatus as Deal["sources"][number]["link_status"],
          last_verified_at: source.lastVerifiedAt?.toISOString(),
          wind_record_id: source.windRecordId ?? undefined
        }))
      }))
    })),
    runs: (runs as RunRow[]).map((run) => ({ ...(run.payload as WeeklyPayload), id: run.id, status: run.status }))
  };
}
