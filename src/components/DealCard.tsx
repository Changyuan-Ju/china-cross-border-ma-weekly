import Link from "next/link";
import { clsx } from "clsx";
import type { Deal } from "@/lib/types";
import { fmtDate, fmtMoney, stageLabel } from "@/lib/format";
import { Badge } from "./Badge";
import { SourceLink } from "./SourceLink";
import { SuggestionButton } from "./SuggestionButton";

export function DealCard({ deal, featured = false, variant }: { deal: Deal; featured?: boolean; variant?: "featured" | "standard" | "compact" }) {
  const source = deal.sources[0];
  const mode = variant ?? (featured ? "featured" : "standard");
  const compact = mode === "compact";
  const stageTone = deal.transaction_stage === "completed" ? "green" : deal.transaction_stage === "terminated" ? "red" : featured ? "gold" : "neutral";
  const stake = deal.stake_after || deal.stake_change ? `${deal.stake_change ?? "未披露"}% / ${deal.stake_after ?? "未披露"}%` : "未披露";
  const body = deal.detailed_summary ?? deal.article_body;
  return (
    <article className={clsx("space-y-4 border border-line bg-surface hover:border-line2", compact ? "p-4" : "p-5")}>
      <div className={clsx("flex flex-col gap-2", !compact && "md:flex-row md:items-start md:justify-between")}>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={stageTone}>{stageLabel(deal.transaction_stage)}</Badge>
            {deal.visible_tags.slice(0, compact ? 2 : 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h2 className={clsx("font-semibold leading-snug text-ink", compact ? "text-lg" : "text-xl")}>{deal.article_title}</h2>
        </div>
        <div className="tabular shrink-0 text-sm font-medium text-subtle">{fmtDate(deal.announcement_date)}</div>
      </div>
      <div className="grid gap-3 border-y border-line py-4 text-sm md:grid-cols-5">
        <Metric label="买方" value={`${deal.buyer_name_cn}${deal.buyer_ticker ? ` (${deal.buyer_ticker})` : ""}`} />
        <Metric label="标的" value={deal.target_name_cn} />
        <Metric label="国家/地区" value={deal.target_country_or_region ?? "未披露"} />
        <Metric label="股权比例" value={stake} />
        <Metric label="交易对价" value={fmtMoney(deal.consideration_amount, deal.consideration_currency, deal.consideration_text)} />
      </div>
      <p className="text-sm leading-7 text-muted">{compact ? truncate(body, 150) : body}</p>
      <div className="flex flex-wrap gap-3">
        <Link className="focus-ring border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white hover:border-gold hover:bg-[#3a342f] active:bg-ink" href={`/deals/${deal.canonical_deal_id}`}>
          查看交易详情
        </Link>
        <SourceLink source={source} />
        <SuggestionButton targetType="deal" targetId={deal.canonical_deal_id} targetTitle={deal.article_title} />
      </div>
    </article>
  );
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 break-words font-medium text-ink">{value}</div>
    </div>
  );
}
