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
  const countries = Array.from(new Set(deals.map((deal) => deal.target_country_or_region).filter(Boolean))).join("、") || "未披露";
  const industries = Array.from(new Set(deals.map((deal) => deal.target_industry).filter(Boolean))).slice(0, 3).join("、") || "未披露";

  return (
    <div className="shell py-8">
      <section className="border-b border-line pb-7">
        <div className="text-xs font-bold tracking-[0.18em] text-gold">WEEKLY BRIEFING</div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">{fmtIssueRange(issue.start_date, issue.end_date)} 周报</h1>
        <p className="measure mt-4 text-base leading-8 text-muted">{issue.summary}</p>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          <BriefMeta label="主要国家/地区" value={countries} />
          <BriefMeta label="主要行业" value={industries} />
          <BriefMeta label="发布时间" value={issue.published_at.slice(0, 10)} />
        </div>
      </section>
      <div className="mt-6 grid grid-cols-2 border-y border-line bg-surface md:grid-cols-4">
        <Stat label="候选" value={issue.candidate_count} />
        <Stat label="纳入" value={issue.included_count} />
        <Stat label="排除" value={issue.excluded_count} />
        <Stat label="复核" value={issue.review_required_count} />
      </div>
      <SectionTitle number="01" title="本期概览" />
      <p className="measure text-sm leading-7 text-muted">本期正式纳入 {issue.included_count} 笔中资企业跨境并购交易，候选池共 {issue.candidate_count} 条公告记录。候选交易仅在底部单独展示，不进入正式统计。</p>
      <SectionTitle number="02" title="重点交易" />
      <div className="mt-4 grid gap-4">{featured.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} featured variant="featured" />)}</div>
      <SectionTitle number="03" title="其他交易" />
      <div className="mt-4 grid gap-3">{rest.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} variant="compact" />)}</div>
      <CandidateSection candidates={candidates} />
      <section className="mt-10 border-t border-line pt-6 text-sm leading-7 text-muted">
        <h2 className="text-xl font-semibold text-ink">数据来源及方法说明</h2>
        <p className="mt-2">本页面基于公开公告及Wind公告记录整理，交易筛选、去重、阶段归类和重要性排序沿用既有方法。候选交易仅供参考，不代表已符合正式纳入标准。</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-line p-4 last:border-r-0">
      <div className="text-sm text-muted">{label}</div>
      <div className="tabular mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function BriefMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-gold pl-3">
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-1 font-medium text-ink">{value}</div>
    </div>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="mt-9 flex items-center gap-3">
      <span className="tabular text-sm font-semibold text-gold">{number}</span>
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
    </div>
  );
}
