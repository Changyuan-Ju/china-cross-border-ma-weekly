import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { SourceLink } from "@/components/SourceLink";
import { SuggestionButton } from "@/components/SuggestionButton";
import { fmtDate, fmtMoney, stageLabel } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await readStore();
  const deal = store.deals.find((item) => item.canonical_deal_id === id);
  if (!deal) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="blue">{stageLabel(deal.transaction_stage)}</Badge>
        <Badge tone={deal.validation_status === "valid" ? "gold" : "red"}>{deal.validation_status}</Badge>
        {deal.visible_tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      <h1 className="text-3xl font-semibold leading-tight text-ink">{deal.article_title}</h1>
      <p className="mt-4 text-base leading-8 text-muted">{deal.article_body}</p>

      <section className="mt-8 grid gap-4 border-y border-line py-6 md:grid-cols-3">
        <Metric label="买方" value={`${deal.buyer_name_cn}${deal.buyer_ticker ? ` (${deal.buyer_ticker})` : ""}`} />
        <Metric label="卖方" value={deal.seller_names.join("、") || "未披露"} />
        <Metric label="标的" value={deal.target_name_cn} />
        <Metric label="国家/地区" value={deal.target_country_or_region ?? "未披露"} />
        <Metric label="行业" value={deal.target_industry ?? "未披露"} />
        <Metric label="交易对价" value={fmtMoney(deal.consideration_amount, deal.consideration_currency, deal.consideration_text)} />
        <Metric label="股权变化" value={`${deal.stake_before ?? "未披露"} -> ${deal.stake_after ?? "未披露"}%`} />
        <Metric label="支付方式" value={deal.payment_methods.join("、") || "未披露"} />
        <Metric label="公告日期" value={fmtDate(deal.announcement_date)} />
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Panel title="战略目的">
          {deal.strategic_rationale.length ? deal.strategic_rationale.map((item) => <li key={item}>{item}</li>) : <li>未披露</li>}
        </Panel>
        <Panel title="信息缺口">
          {deal.information_gaps.length ? deal.information_gaps.map((item) => <li key={item}>{item}</li>) : <li>暂无重大缺口</li>}
        </Panel>
      </section>

      <section className="mt-8 border border-line bg-white p-5">
        <h2 className="text-xl font-semibold text-ink">公告时间线</h2>
        <div className="mt-4 space-y-4">
          {deal.sources.map((source) => (
            <div key={`${source.title}-${source.published_at ?? ""}`} className="border-l-2 border-gold pl-4">
              <div className="font-mono text-sm text-muted">{source.published_at ? fmtDate(source.published_at) : fmtDate(deal.announcement_date)}</div>
              <div className="mt-1 font-medium text-ink">{source.title}</div>
              <div className="mt-2"><SourceLink source={source} /></div>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-6 flex justify-end">
        <SuggestionButton targetType="deal" targetId={deal.canonical_deal_id} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 break-words font-medium text-ink">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line bg-white p-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">{children}</ul>
    </div>
  );
}
