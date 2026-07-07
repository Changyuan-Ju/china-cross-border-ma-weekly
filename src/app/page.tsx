import Link from "next/link";
import { Archive, Database, FileText, Globe2 } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { fmtIssueRange } from "@/lib/format";
import { rankDeals, topDeals } from "@/lib/ranking";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await readStore();
  const latest = store.issues[0];
  const issueDeals = latest ? store.deals.filter((deal) => latest.deal_ids.includes(deal.canonical_deal_id)) : [];
  const featured = topDeals(issueDeals);
  const others = rankDeals(issueDeals).filter((deal) => !featured.some((item) => item.canonical_deal_id === deal.canonical_deal_id));
  const countries = new Set(issueDeals.map((deal) => deal.target_country_or_region).filter(Boolean));
  const initialCount = issueDeals.filter((deal) => deal.announcement_type === "initial").length;
  const completedCount = issueDeals.filter((deal) => deal.transaction_stage === "completed").length;

  return (
    <div className="shell py-8">
      <section className="border-b border-line pb-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-gold">最新周报</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-ink md:text-[42px]">{latest ? fmtIssueRange(latest.start_date, latest.end_date) : "暂无已发布周报"}</h1>
            <p className="measure mt-4 text-base leading-8 text-muted">
              {latest?.summary ?? "暂无可展示周报。"}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-subtle">
              <FileText size={16} className="text-gold" />
              <span>数据更新：{latest?.published_at ? latest.published_at.slice(0, 10) : "未发布"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {latest ? (
              <Link href={`/weekly/${latest.id}`} className="focus-ring inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white hover:border-gold">
                <FileText size={16} /> 查看完整周报
              </Link>
            ) : null}
            <Link href="/deals" className="focus-ring inline-flex items-center gap-2 border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-gold">
              <Database size={16} /> 交易数据库
            </Link>
            <Link href="/archive" className="focus-ring inline-flex items-center gap-2 border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-gold">
              <Archive size={16} /> 历史周报
            </Link>
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
          <h2 className="text-2xl font-semibold text-ink">本周重点交易</h2>
        </div>
        <div className="grid gap-4">
          {featured.length ? featured.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} featured variant="featured" />) : <EmptyState />}
        </div>
      </section>

      <section className="pb-10">
        <h2 className="mb-4 text-2xl font-semibold text-ink">其他交易</h2>
        <div className="grid gap-3">{others.length ? others.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} variant="compact" />) : <EmptyState />}</div>
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
