import Link from "next/link";
import type { Deal } from "@/lib/types";
import { fmtDate, fmtMoney, stageLabel } from "@/lib/format";
import { Badge } from "./Badge";
import { SourceLink } from "./SourceLink";
import { SuggestionButton } from "./SuggestionButton";

export function DealCard({ deal, featured = false }: { deal: Deal; featured?: boolean }) {
  const source = deal.sources[0];
  return (
    <article className="border border-line bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone={featured ? "gold" : "blue"}>{stageLabel(deal.transaction_stage)}</Badge>
            <Badge>{deal.deal_direction}</Badge>
            {deal.visible_tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h2 className="text-xl font-semibold leading-snug text-ink">{deal.article_title}</h2>
        </div>
        <div className="font-mono text-sm text-muted">{fmtDate(deal.announcement_date)}</div>
      </div>
      <div className="mt-4 grid gap-3 border-y border-line py-4 text-sm md:grid-cols-4">
        <Metric label="买方" value={`${deal.buyer_name_cn}${deal.buyer_ticker ? ` (${deal.buyer_ticker})` : ""}`} />
        <Metric label="标的" value={deal.target_name_cn} />
        <Metric label="国家/地区" value={deal.target_country_or_region ?? "未披露"} />
        <Metric label="交易对价" value={fmtMoney(deal.consideration_amount, deal.consideration_currency, deal.consideration_text)} />
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{deal.article_body}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link className="focus-ring border border-blue bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue2 active:bg-ink" href={`/deals/${deal.canonical_deal_id}`}>
          查看交易详情
        </Link>
        <SourceLink source={source} />
        <SuggestionButton targetType="deal" targetId={deal.canonical_deal_id} />
      </div>
    </article>
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
