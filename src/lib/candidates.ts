import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { CANDIDATE_DATA_CACHE_TAG, DATA_CACHE_SECONDS } from "./data-cache";
import type { CandidateItem, Deal } from "./types";

async function readIssueCandidates(issueId: string): Promise<CandidateItem[]> {
  const [start, end] = issueId.split("-to-");
  const runIdPrefix = `run-`;
  const runs = await prisma.ingestionRun.findMany({ where: { issueId, id: { startsWith: runIdPrefix } }, select: { id: true } });
  const runIds = runs.map((run) => run.id);
  if (!runIds.length) return [];

  const [excluded, reviewItems, manualSubmissions] = await Promise.all([
    prisma.excludedCandidate.findMany({ where: { runId: { in: runIds } }, orderBy: { announcementDate: "desc" } }),
    prisma.reviewItem.findMany({ where: { runId: { in: runIds }, status: { not: "approved" } }, orderBy: { createdAt: "desc" } }),
    prisma.manualSubmission.findMany({
      where: {
        status: { in: ["submitted", "review_required"] },
        createdAt: { gte: new Date(start), lte: new Date(`${end}T23:59:59.999Z`) }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const excludedItems: CandidateItem[] = excluded.map((item) => ({
    id: item.id,
    issue_id: issueId,
    status: "excluded",
    candidate_title: item.candidateName,
    buyer_name: item.buyerName,
    buyer_ticker: item.buyerTicker,
    target_name: item.targetName,
    announcement_date: item.announcementDate?.toISOString().slice(0, 10) ?? null,
    current_status: item.status,
    reason: item.exclusionReason,
    information_gaps: item.informationGaps,
    original_title: item.announcementTitle,
    source_title: item.sourceTitle ?? item.source,
    source_url: item.sourceUrl,
    source_publisher: item.source,
    link_status: item.linkStatus
  }));

  const reviewCandidates: CandidateItem[] = reviewItems.map((item) => {
    const payload = item.payload as unknown as Partial<Deal> & { sources?: Deal["sources"] };
    const source = payload.sources?.[0];
    return {
      id: item.id,
      issue_id: issueId,
      status: "review_required",
      candidate_title: payload.article_title ?? item.reason,
      buyer_name: payload.buyer_name_cn,
      buyer_ticker: payload.buyer_ticker,
      target_name: payload.target_name_cn,
      announcement_date: payload.announcement_date ?? null,
      current_status: item.status,
      reason: item.reason,
      information_gaps: payload.information_gaps ?? [],
      original_title: source?.title ?? payload.article_title ?? item.reason,
      source_title: source?.title,
      source_url: source?.url,
      source_publisher: source?.publisher,
      link_status: source?.link_status ?? "not_publicly_available"
    };
  });

  const manualCandidates: CandidateItem[] = manualSubmissions.map((item) => ({
    id: item.id,
    issue_id: issueId,
    status: "review_required",
    candidate_title: item.title,
    buyer_name: null,
    buyer_ticker: null,
    target_name: null,
    announcement_date: item.createdAt.toISOString().slice(0, 10),
    current_status: item.status,
    reason: "人工补充，待复核",
    information_gaps: ["需通过Wind及官方公告进一步核验"],
    original_title: item.title,
    source_title: item.sourceUrl ? "人工提交链接" : "人工提交",
    source_url: item.sourceUrl,
    source_publisher: "人工补充",
    link_status: item.sourceUrl ? "valid" : "not_publicly_available"
  }));

  return [...reviewCandidates, ...manualCandidates, ...excludedItems];
}

export const getIssueCandidates = unstable_cache(readIssueCandidates, ["issue-candidates-v1"], {
  revalidate: DATA_CACHE_SECONDS,
  tags: [CANDIDATE_DATA_CACHE_TAG]
});

export async function getAllCandidates(): Promise<CandidateItem[]> {
  const issues = await prisma.weeklyIssue.findMany({ select: { id: true }, orderBy: { endDate: "desc" }, take: 20 });
  const nested = await Promise.all(issues.map((issue) => getIssueCandidates(issue.id)));
  return nested.flat();
}

export type CandidateCounts = { reviewRequired: number; excluded: number };

export function countCandidates(candidates: CandidateItem[]): CandidateCounts {
  return {
    reviewRequired: candidates.filter((item) => item.status === "review_required").length,
    excluded: candidates.filter((item) => item.status === "excluded").length
  };
}
