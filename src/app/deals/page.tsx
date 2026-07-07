import { Suspense } from "react";
import { CandidateSection } from "@/components/CandidateSection";
import { DealCard } from "@/components/DealCard";
import { Filters } from "@/components/Filters";
import { getAllCandidates } from "@/lib/candidates";
import { rankDeals } from "@/lib/ranking";
import { readStore } from "@/lib/store";

export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const store = await readStore();
  const countries = unique(store.deals.map((deal) => deal.target_country_or_region));
  const industries = unique(store.deals.map((deal) => deal.target_industry));
  const stages = unique(store.deals.map((deal) => deal.transaction_stage));
  const q = params.q?.toLowerCase();
  const status = params.status ?? "已纳入";
  const page = Math.max(1, Number(params.page ?? "1"));
  const pageSize = 10;
  const candidates = status === "已纳入" ? [] : await getAllCandidates();
  const visibleCandidates = candidates.filter((item) => (status === "待复核" ? item.status === "review_required" : item.status === "excluded"));
  const filteredDeals = rankDeals(
    store.deals.filter((deal) => {
      const haystack = [deal.buyer_name_cn, deal.buyer_ticker, deal.target_name_cn, deal.article_title, deal.article_body].filter(Boolean).join(" ").toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (!params.country || deal.target_country_or_region === params.country) &&
        (!params.industry || deal.target_industry === params.industry) &&
        (!params.stage || deal.transaction_stage === params.stage)
      );
    })
  );
  const deals = filteredDeals.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / pageSize));

  const resultCount = status === "已纳入" ? filteredDeals.length : visibleCandidates.length;

  return (
    <div className="shell py-8">
      <div className="mb-6">
        <div className="text-xs font-bold tracking-[0.18em] text-gold">DEAL DATABASE</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">交易数据库</h1>
        <p className="mt-3 text-sm leading-7 text-muted">按公司、证券代码、标的、国家/地区、行业、阶段和状态筛选。待复核及已排除项目单独展示，不计入正式交易统计。</p>
      </div>
      <Suspense>
        <Filters countries={countries} industries={industries} stages={stages} resultCount={resultCount} />
      </Suspense>
      <div className="mt-6 grid gap-4">
        {status === "已纳入" ? (
          deals.length ? deals.map((deal) => <DealCard key={deal.canonical_deal_id} deal={deal} variant="compact" />) : <div className="border border-line bg-surface p-6 text-sm text-muted">没有符合条件的交易。</div>
        ) : (
          <CandidateSection candidates={visibleCandidates} />
        )}
      </div>
      {status === "已纳入" ? <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <span>第 {page} / {totalPages} 页，共 {filteredDeals.length} 笔</span>
        <div className="flex gap-2">
          <PageLink disabled={page <= 1} page={page - 1} params={params}>上一页</PageLink>
          <PageLink disabled={page >= totalPages} page={page + 1} params={params}>下一页</PageLink>
        </div>
      </div> : null}
    </div>
  );
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function PageLink({ children, disabled, page, params }: { children: React.ReactNode; disabled: boolean; page: number; params: Record<string, string | undefined> }) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") next.set(key, value);
  });
  next.set("page", String(page));
  if (disabled) return <span className="border border-line bg-paper px-3 py-2 text-muted">{children}</span>;
  return <a className="focus-ring border border-line bg-white px-3 py-2 text-ink hover:border-blue hover:text-blue" href={`/deals?${next.toString()}`}>{children}</a>;
}
