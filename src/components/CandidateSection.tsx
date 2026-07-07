import { ExternalLink } from "lucide-react";
import type { CandidateItem } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { SuggestionButton } from "./SuggestionButton";

export function CandidateSection({ candidates }: { candidates: CandidateItem[] }) {
  const reviewItems = candidates.filter((item) => item.status === "review_required");
  const excludedItems = candidates.filter((item) => item.status === "excluded");
  if (!candidates.length) return null;
  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="text-2xl font-semibold text-ink">本期其他候选交易</h2>
      <p className="mt-3 text-sm leading-7 text-muted">以下项目尚未纳入正式交易数据库，仅供参考，不代表网站确认其符合跨境并购筛选标准。</p>
      <CandidateGroup title={`待复核（${reviewItems.length}）`} items={reviewItems} targetType="review_item" />
      <CandidateGroup title={`已排除（${excludedItems.length}）`} items={excludedItems} targetType="excluded_candidate" />
    </section>
  );
}

function CandidateGroup({ title, items, targetType }: { title: string; items: CandidateItem[]; targetType: string }) {
  return (
    <details className="mt-4 border border-line bg-white p-4" open>
      <summary className="cursor-pointer text-lg font-semibold text-ink">{title}</summary>
      <div className="mt-4 grid gap-3">
        {items.length ? items.map((item) => <CandidateCard key={item.id} item={item} targetType={targetType} />) : <div className="text-sm text-muted">暂无记录。</div>}
      </div>
    </details>
  );
}

function CandidateCard({ item, targetType }: { item: CandidateItem; targetType: string }) {
  const canOpen = Boolean(item.source_url && item.link_status === "valid");
  return (
    <article className="border border-line bg-paper p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-semibold leading-6 text-ink">{item.candidate_title}</h3>
          <div className="mt-2 text-sm text-muted">原始公告：{item.original_title}</div>
        </div>
        <div className="font-mono text-sm text-muted">{item.announcement_date ? fmtDate(item.announcement_date) : "未披露"}</div>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <Metric label="买方及证券代码" value={`${item.buyer_name ?? "未披露"}${item.buyer_ticker ? ` (${item.buyer_ticker})` : ""}`} />
        <Metric label="标的" value={item.target_name ?? "未披露"} />
        <Metric label="当前状态" value={item.current_status} />
      </div>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <Metric label={item.status === "review_required" ? "待复核原因" : "排除原因"} value={item.reason} />
        <Metric label="信息缺口" value={item.information_gaps.length ? item.information_gaps.join("；") : "未列示"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {canOpen ? (
          <a className="focus-ring inline-flex items-center gap-2 border border-line bg-white px-4 py-2 text-sm text-ink hover:border-blue hover:text-blue" href={item.source_url ?? ""} target="_blank" rel="noreferrer">
            有效公告链接 <ExternalLink size={14} />
          </a>
        ) : (
          <span className="border border-line bg-white px-4 py-2 text-sm text-muted">Wind公告库，公开链接未取得</span>
        )}
        <SuggestionButton targetType={targetType} targetId={item.id} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 break-words text-ink">{value}</div>
    </div>
  );
}
