import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { CANDIDATE_DATA_CACHE_TAG, DATA_CACHE_SECONDS } from "./data-cache";
import type { CandidateItem } from "./types";

async function readIssueCandidates(issueId: string): Promise<CandidateItem[]> {
  const run = await prisma.ingestionRun.findFirst({
    where: { issueId, status: "completed" },
    orderBy: [{ runStartedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true }
  });
  if (!run) return [];

  const excluded = await prisma.excludedCandidate.findMany({
    where: { runId: run.id },
    orderBy: [{ announcementDate: "desc" }, { candidateName: "asc" }]
  });

  return excluded.map((item) => ({
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
}

export const getIssueCandidates = unstable_cache(readIssueCandidates, ["issue-candidates-v2"], {
  revalidate: DATA_CACHE_SECONDS,
  tags: [CANDIDATE_DATA_CACHE_TAG]
});

export async function getAllCandidates(): Promise<CandidateItem[]> {
  const issues = await prisma.weeklyIssue.findMany({ select: { id: true }, orderBy: { endDate: "desc" }, take: 20 });
  const nested = await Promise.all(issues.map((issue) => getIssueCandidates(issue.id)));
  return nested.flat();
}

export type CandidateCounts = { excluded: number };

export function countCandidates(candidates: CandidateItem[]): CandidateCounts {
  return { excluded: candidates.length };
}
