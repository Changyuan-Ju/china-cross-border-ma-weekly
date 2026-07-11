import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { SourceLink } from "@/components/SourceLink";
import { SuggestionButton } from "@/components/SuggestionButton";
import { announcementTypeLabel, fmtDate, fmtMoney, linkStatusLabel, sourceTypeLabel, stageLabel, validationLabel } from "@/lib/format";
import { readStore } from "@/lib/store";
import { dedupeTags } from "@/lib/tag-utils";
import type { Deal, DealEventItem } from "@/lib/types";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await readStore();
  const deal = store.deals.find((item) => item.canonical_deal_id === id);
  if (!deal) notFound();

  const timeline = deal.events?.length ? deal.events : sourcesAsEvents(deal);
  const summary = deal.detailed_summary ?? deal.transaction_facts ?? deal.article_body;
  const strategicRationale = deal.strategic_rationale.length ? deal.strategic_rationale : textList((deal.target_profile as Record<string, unknown> | null | undefined)?.strategicRationale);
  const displayTags = dedupeTags(deal.visible_tags, [stageLabel(deal.transaction_stage)]);

  return (
    <div className="shell py-8">
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge tone={deal.transaction_stage === "completed" ? "green" : "gold"}>{stageLabel(deal.transaction_stage)}</Badge>
        <Badge tone={deal.validation_status === "valid" ? "manual" : "red"}>{validationLabel(deal.validation_status)}</Badge>
        {displayTags.slice(0, 6).map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        {deal.is_manual_supplement ? <Badge tone="gold">人工补充</Badge> : null}
      </div>

      <h1 className="max-w-5xl text-3xl font-semibold leading-tight text-ink md:text-4xl">{deal.article_title}</h1>
      <p className="measure mt-4 text-base leading-8 text-muted">{summary}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <main className="space-y-8">
          <section className="grid gap-4 border-y border-line py-6 md:grid-cols-3">
            <Metric label="买方" value={`${deal.buyer_name_cn}${deal.buyer_ticker ? ` (${deal.buyer_ticker})` : ""}`} />
            <Metric label="卖方" value={deal.seller_names.join("、") || "未披露"} />
            <Metric label="标的" value={deal.target_name_cn} />
            <Metric label="国家/地区" value={deal.target_country_or_region ?? "未披露"} />
            <Metric label="行业" value={deal.target_industry ?? "未披露"} />
            <Metric label="最新状态" value={deal.current_status} />
            <Metric label="交易类型" value={deal.transaction_type} />
            <Metric label="交易方向" value={deal.deal_direction} />
            <Metric label="交易对价" value={fmtMoney(deal.consideration_amount, deal.consideration_currency, deal.consideration_text)} />
            <Metric label="股权变化" value={`${percent(deal.stake_before)} -> ${percent(deal.stake_after)}；本次变动 ${percent(deal.stake_change)}`} />
            <Metric label="是否取得控制权" value={deal.obtains_control === undefined || deal.obtains_control === null ? "未披露" : deal.obtains_control ? "是" : "否"} />
            <Metric label="支付方式" value={deal.payment_methods.join("、") || "未披露"} />
          </section>

          <TextSection title="交易结构" content={deal.transaction_structure} />

          <section className="grid gap-6 md:grid-cols-2">
            <Panel title="标的公司或资产介绍">
              <DefinitionList value={deal.target_profile} empty="未披露标的详细资料" />
            </Panel>
            <Panel title="标的财务信息">
              <Financials value={deal.target_financials} />
            </Panel>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <Panel title="对价构成">
              <DefinitionList value={deal.consideration_breakdown} empty="未披露对价拆分" />
            </Panel>
            <TextPanel title="定价依据" content={deal.pricing_basis} empty="未披露定价依据" />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <Panel title="交易逻辑">
              {strategicRationale.length ? strategicRationale.map((item) => <li key={item}>{item}</li>) : <li>未披露</li>}
            </Panel>
            <Panel title="审批及交割条件">
              <DefinitionList value={deal.approvals_and_conditions ?? { closingConditions: deal.closing_conditions }} empty="未披露审批或交割条件" />
            </Panel>
          </section>

          <section className="border border-line bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">交易时间线</h2>
            <div className="mt-4 space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="border-l-2 border-gold pl-4">
                  <div className="tabular text-sm text-subtle">{fmtDate(event.announcement_date)}</div>
                  <div className="mt-1 font-medium text-ink">{event.title}</div>
                  <div className="mt-1 text-sm text-muted">{stageLabel(event.transaction_stage)} · {announcementTypeLabel(event.announcement_type)}</div>
                  {event.body ? <p className="mt-2 text-sm leading-7 text-muted">{event.body}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(event.sources?.length ? event.sources : deal.sources).map((source) => (
                      <SourceLink key={`${event.id}-${source.title}-${source.published_at ?? ""}`} source={source} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-line bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">公告来源</h2>
            <div className="mt-4 space-y-3">
              {deal.sources.map((source) => (
                <div key={`${source.title}-${source.published_at ?? ""}`} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                  <div className="font-medium text-ink">{source.title}</div>
                  <div className="mt-1 text-xs text-subtle">
                    {source.publisher ?? "Wind公告库"} · {source.published_at ? fmtDate(source.published_at) : "日期未披露"} · {sourceTypeLabel(source.source_type ?? "wind_record")} · {linkStatusLabel(source.link_status ?? "valid")}
                  </div>
                  <div className="mt-2"><SourceLink source={source} /></div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <Panel title="核心交易数据">
            <li>公告日期：{fmtDate(deal.announcement_date)}</li>
            <li>对价：{fmtMoney(deal.consideration_amount, deal.consideration_currency, deal.consideration_text)}</li>
            <li>国家/地区：{deal.target_country_or_region ?? "未披露"}</li>
            <li>行业：{deal.target_industry ?? "未披露"}</li>
          </Panel>
          <Panel title="关键日期">
            <DefinitionList value={deal.key_dates} empty="未披露额外关键日期" />
          </Panel>
          <Panel title="信息缺口">
            {deal.information_gaps.length ? deal.information_gaps.map((item) => <li key={item}>{item}</li>) : <li>暂无重大缺口</li>}
          </Panel>
          <Panel title="最近更新">
            <li>首次公告：{timeline[0] ? fmtDate(timeline[0].announcement_date) : fmtDate(deal.announcement_date)}</li>
            <li>最近公告：{fmtDate(deal.announcement_date)}</li>
            <li>最近核验：{deal.last_verified_at ? fmtDate(deal.last_verified_at) : "未记录"}</li>
            <li>来源数量：{deal.sources.length}</li>
          </Panel>
          <div className="border border-line bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">调整建议</h2>
            <p className="mt-2 text-sm leading-6 text-muted">公众建议不会直接改变交易状态，需管理员复核。</p>
            <div className="mt-4"><SuggestionButton targetType="deal" targetId={deal.canonical_deal_id} targetTitle={deal.article_title} /></div>
          </div>
        </aside>
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
    <div className="border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">{children}</ul>
    </div>
  );
}

function TextSection({ title, content }: { title: string; content?: string | null }) {
  return (
    <section className="border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{content || "未披露"}</p>
    </section>
  );
}

function TextPanel({ title, content, empty }: { title: string; content?: string | null; empty: string }) {
  return (
    <div className="border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{content || empty}</p>
    </div>
  );
}

function DefinitionList({ value, empty }: { value: unknown; empty: string }) {
  const entries = objectEntries(value);
  if (!entries.length) return <li>{empty}</li>;
  return entries.map(([key, item]) => (
    <li key={key}>
      <span className="font-medium text-ink">{labelize(key)}：</span>
      {formatUnknown(item)}
    </li>
  ));
}

function Financials({ value }: { value: Deal["target_financials"] }) {
  if (!value) return <li>未披露标的财务数据</li>;
  if (Array.isArray(value)) {
    return value.map((row, index) => (
      <li key={index}>
        {objectEntries(row).map(([key, item]) => `${labelize(key)}：${formatUnknown(item)}`).join("；")}
      </li>
    ));
  }
  return <DefinitionList value={value} empty="未披露标的财务数据" />;
}

function sourcesAsEvents(deal: Deal): DealEventItem[] {
  return deal.sources.map((source, index) => ({
    id: `${deal.canonical_deal_id}-${index}`,
    announcement_date: source.published_at ?? deal.announcement_date,
    announcement_type: deal.announcement_type,
    transaction_stage: deal.transaction_stage,
    title: source.title,
    body: index === 0 ? deal.article_body : "",
    source_fingerprint: `${source.title}-${source.published_at ?? ""}`,
    sources: [source]
  }));
}

function objectEntries(value: unknown): Array<[string, unknown]> {
  if (!value || Array.isArray(value) || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== null && item !== undefined && item !== "");
}

function textList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function formatUnknown(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatUnknown).join("；");
  if (value && typeof value === "object") return objectEntries(value).map(([key, item]) => `${labelize(key)}：${formatUnknown(item)}`).join("；");
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value ?? "未披露");
}

function labelize(key: string) {
  const labels: Record<string, string> = {
    name: "名称",
    establishedAt: "成立时间",
    registeredAddress: "注册地址",
    business: "主营业务",
    location: "所在地",
    shareCapital: "股本",
    ownership: "股权结构",
    buyer: "买方",
    seller: "卖方",
    target: "标的",
    totalConsideration: "总对价",
    payment: "支付安排",
    adjustment: "调整机制",
    basisDate: "基准日",
    boardApproval: "董事会审批",
    shareholderApproval: "股东大会审批",
    regulatoryFilings: "监管/备案",
    closingConditions: "交割条件",
    announcement: "公告日",
    agreement: "协议签署日",
    completion: "交割完成日"
  };
  return labels[key] ?? key;
}

function percent(value?: number | null) {
  return typeof value === "number" ? `${value}%` : "未披露";
}
