import { FileText, Globe2 } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { fmtIssueRange, fmtIssueSummary } from "@/lib/format";
import { rankDeals } from "@/lib/ranking";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await readStore();
  const latest = store.issues[0];
  const issueDeals = latest ? store.deals.filter((deal) => latest.deal_ids.includes(deal.canonical_deal_id)) : [];
  const rankedDeals = rankDeals(issueDeals);
  const countries = new Set(issueDeals.map((deal) => deal.target_country_or_region).filter(Boolean));
  const initialCount = issueDeals.filter((deal) => (deal.events ?? []).some((event) => event.announcement_type === "initial") || deal.announcement_type === "initial").length;
  const completedCount = issueDeals.filter((deal) => deal.transaction_stage === "completed").length;

  return (
    <div className="shell py-8">
      <section className="border-b border-line pb-8">
        <div>
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-gold">最新周报</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-ink md:text-[42px]">{latest ? fmtIssueRange(latest.start_date, latest.end_date) : "暂无已发布周报"}</h1>
            <p className="measure mt-4 text-base leading-8 text-muted">
              {latest ? fmtIssueSummary(latest.summary, latest.included_count) : "暂无可展示周报。"}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-subtle">
              <FileText size={16} className="text-gold" />
              <span>数据更新：{latest?.published_at ? latest.published_at.slice(0, 10) : "未发布"}</span>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 border-y border-line bg-surface md:grid-cols-4">
          <Stat label="本期交易" value={String(latest?.included_count ?? 0)} />
          <Stat label="国家/地区" value={String(countries.size)} />
          <Stat label="首次披露" value={String(initialCount)} />
          <Stat label="完成交割" value={String(completedCount)} />
        </div>
      </section>

      <section className="py-8">
        <div className="mb-4 flex items-center gap-2">
          <Globe2 size={18} className="text-gold" />
          <h2 className="text-2xl font-semibold text-ink">本周交易</h2>
        </div>
        <div className="grid gap-4">
          {rankedDeals.length ? rankedDeals.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} variant="standard" />) : <EmptyState />}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-line p-4 last:border-r-0">
      <div className="text-sm text-muted">{label}</div>
      <div className="tabular mt-2 text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function EmptyState() {
  return <div className="border border-line bg-surface p-6 text-sm text-muted">暂无可展示交易。</div>;
}
