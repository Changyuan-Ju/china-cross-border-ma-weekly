import { notFound } from "next/navigation";
import { CandidateSection } from "@/components/CandidateSection";
import { DealCard } from "@/components/DealCard";
import { fmtIssueRange } from "@/lib/format";
import { rankDeals, topDeals } from "@/lib/ranking";
import { readStore } from "@/lib/store";
import { getIssueCandidates } from "@/lib/candidates";

export default async function WeeklyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await readStore();
  const issue = store.issues.find((item) => item.id === id);
  if (!issue) notFound();
  const deals = store.deals.filter((deal) => issue.deal_ids.includes(deal.canonical_deal_id));
  const featured = topDeals(deals);
  const rest = rankDeals(deals);
  const candidates = await getIssueCandidates(id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-ink">{fmtIssueRange(issue.start_date, issue.end_date)} 周报</h1>
      <p className="mt-3 text-sm leading-7 text-muted">{issue.summary}</p>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Stat label="候选" value={issue.candidate_count} />
        <Stat label="纳入" value={issue.included_count} />
        <Stat label="排除" value={issue.excluded_count} />
        <Stat label="复核" value={issue.review_required_count} />
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-ink">重点交易</h2>
      <div className="mt-4 grid gap-4">{featured.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} featured />)}</div>
      <h2 className="mt-8 text-2xl font-semibold text-ink">全部交易</h2>
      <div className="mt-4 grid gap-4">{rest.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} />)}</div>
      <CandidateSection candidates={candidates} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line bg-white p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
