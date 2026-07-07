import Link from "next/link";
import { Archive, Database, Globe2 } from "lucide-react";
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="border-b border-line pb-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-blue">最新周报</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">{latest ? fmtIssueRange(latest.start_date, latest.end_date) : "暂无已发布周报"}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
              {latest?.summary ?? "请先运行采集任务或通过内部 API 推送结构化周报数据。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/deals" className="focus-ring inline-flex items-center gap-2 border border-blue bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue2 active:bg-ink">
              <Database size={16} /> 交易数据库
            </Link>
            <Link href="/archive" className="focus-ring inline-flex items-center gap-2 border border-line bg-white px-4 py-2 text-sm text-ink hover:border-blue hover:text-blue">
              <Archive size={16} /> 历史周报
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
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
          {featured.length ? featured.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} featured />) : <EmptyState />}
        </div>
      </section>

      <section className="pb-10">
        <h2 className="mb-4 text-2xl font-semibold text-ink">其他交易</h2>
        <div className="grid gap-4">{others.length ? others.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} />) : <EmptyState />}</div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function EmptyState() {
  return <div className="border border-line bg-white p-6 text-sm text-muted">暂无可展示交易。运行 `npm run ingest:weekly` 后会自动更新。</div>;
}
