"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TeaserOpportunityView } from "@/lib/teasers/types";

const palette = ["#0C4E98", "#0F60A9", "#C19A66", "#B69B80", "#595959", "#A10000", "#C5C5C5"];

export function TeaserCharts({ opportunities, onSelectOpportunity }: { opportunities: TeaserOpportunityView[]; onSelectOpportunity: (item: TeaserOpportunityView) => void }) {
  const industries = group(opportunities.map((item) => item.industry || "未分类")).slice(0, 10);
  const regions = group(opportunities.map((item) => item.region || item.country || "未披露")).slice(0, 6);

  return <div className="grid gap-4 xl:grid-cols-2">
    <ChartFrame title="行业分布" note="按每个项目的主行业分类统计。">
      {industries.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={industries} layout="vertical" margin={{ left: 8, right: 24 }}><CartesianGrid stroke="#D9D5CE" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: "#595959", fontSize: 11 }} /><YAxis type="category" dataKey="name" width={96} tick={{ fill: "#404040", fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="项目数量" fill="#0C4E98" /></BarChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <ChartFrame title="总部区域分布" note="优先使用总部所在区域；未披露时使用总部所在国家。">
      {regions.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={regions} dataKey="value" nameKey="name" innerRadius={62} outerRadius={102} paddingAngle={1} stroke="#FFFDF9">{regions.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend verticalAlign="bottom" iconType="square" wrapperStyle={{ fontSize: 11, color: "#595959" }} /></PieChart></ResponsiveContainer> : <EmptyChart />}
    </ChartFrame>

    <FinancialComparison opportunities={opportunities} onSelectOpportunity={onSelectOpportunity} />
  </div>;
}

type FinancialSortKey = "revenueUsd" | "ebitdaUsd" | "netProfitUsd" | "ebitdaMargin" | "revenueGrowth";

function FinancialComparison({ opportunities, onSelectOpportunity }: { opportunities: TeaserOpportunityView[]; onSelectOpportunity: (item: TeaserOpportunityView) => void }) {
  const [sortBy, setSortBy] = useState<FinancialSortKey>("revenueUsd");
  const rows = opportunities.filter(hasFinancialProfile).map((item) => ({
    ...item,
    calculatedMargin: item.ebitdaMargin ?? (item.revenueUsd && item.ebitdaUsd !== null ? item.ebitdaUsd / item.revenueUsd * 100 : null)
  }));
  const sortedRows = [...rows].sort((left, right) => {
    const leftValue = financialSortValue(left, sortBy);
    const rightValue = financialSortValue(right, sortBy);
    if (leftValue === null && rightValue === null) return left.title.localeCompare(right.title, "zh-CN");
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;
    return rightValue - leftValue;
  });

  const revenueValues = rows.map((item) => item.revenueUsd).filter(isNumber);
  const marginValues = rows.map((item) => item.calculatedMargin).filter(isNumber);
  const growthValues = rows.map((item) => item.revenueGrowth).filter(isNumber);

  return <ChartFrame title="财务横向对比" note="规模统一为百万美元；利润率及增速均为百分比。仅展示资料中明确披露或可直接计算的数据。" wide>
    {rows.length ? <>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <FinancialSummary label="收入中位数" value={formatUsdSummary(median(revenueValues))} note={`基于 ${revenueValues.length} 个项目`} />
        <FinancialSummary label="EBITDA利润率中位数" value={formatPercent(median(marginValues))} note={`基于 ${marginValues.length} 个项目`} />
        <FinancialSummary label="收入增速中位数" value={formatPercent(median(growthValues), true)} note={`基于 ${growthValues.length} 个项目`} />
      </div>

      <div className="mt-4 flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="text-xs font-semibold text-ink">项目明细</div><div className="mt-1 text-[11px] text-subtle">共 {rows.length} 个项目具备至少一项可比财务数据；“—”表示未披露。</div></div>
        <label className="flex items-center gap-2 text-xs text-muted">排序依据
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as FinancialSortKey)} className="focus-ring border border-line bg-paper px-2.5 py-2 text-xs text-ink">
            <option value="revenueUsd">收入</option>
            <option value="ebitdaUsd">EBITDA</option>
            <option value="netProfitUsd">净利润</option>
            <option value="ebitdaMargin">EBITDA利润率</option>
            <option value="revenueGrowth">收入增速</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto border-x border-b border-line">
        <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
          <caption className="sr-only">Teaser项目财务规模、盈利能力及同比增速横向对比</caption>
          <thead>
            <tr className="border-b border-line bg-[#F1F1F1] text-[10px] font-semibold tracking-[0.08em] text-muted">
              <th rowSpan={2} className="sticky left-0 z-20 w-[310px] border-r border-line bg-[#F1F1F1] px-4 py-3 align-bottom">项目</th>
              <th colSpan={3} className="border-r border-line px-3 py-2 text-center text-blue">财务规模（USDm）</th>
              <th className="border-r border-line px-3 py-2 text-center text-gold">盈利能力</th>
              <th colSpan={3} className="px-3 py-2 text-center text-blue">同比增速</th>
            </tr>
            <tr className="border-b border-line bg-paper text-[11px] font-semibold text-muted">
              <th className="px-3 py-2 text-right">收入</th>
              <th className="px-3 py-2 text-right">EBITDA</th>
              <th className="border-r border-line px-3 py-2 text-right">净利润</th>
              <th className="border-r border-line px-3 py-2 text-right">EBITDA利润率</th>
              <th className="px-3 py-2 text-right">收入</th>
              <th className="px-3 py-2 text-right">EBITDA</th>
              <th className="px-3 py-2 text-right">净利润</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{sortedRows.map((item, index) => <tr key={item.id} className="group bg-surface hover:bg-paper">
            <td className="sticky left-0 z-10 border-r border-line bg-surface px-4 py-3 group-hover:bg-paper">
              <div className="flex items-start gap-3"><span className="tabular mt-0.5 w-5 shrink-0 text-[10px] text-subtle">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><button type="button" onClick={() => onSelectOpportunity(item)} className="focus-ring group/link flex max-w-full items-start gap-2 text-left text-ink hover:text-blue" title={`查看${item.title}项目详情`}><span className="line-clamp-2 font-semibold leading-5">{item.title}</span><span className="mt-0.5 inline-flex shrink-0 items-center gap-1 border border-[#0C4E98]/30 bg-[#0C4E98]/5 px-1.5 py-0.5 text-[9px] font-semibold text-blue group-hover/link:border-blue">项目索引<ArrowUpRight size={10} /></span></button><div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-subtle"><span>{item.projectCode || "未披露项目代号"}</span>{item.financialYear ? <span>{item.financialYear}</span> : null}{item.industry ? <span>{item.industry}</span> : null}</div></div></div>
            </td>
            <MoneyCell value={item.revenueUsd} emphasized={sortBy === "revenueUsd"} />
            <MoneyCell value={item.ebitdaUsd} emphasized={sortBy === "ebitdaUsd"} />
            <MoneyCell value={item.netProfitUsd} emphasized={sortBy === "netProfitUsd"} bordered />
            <PercentCell value={item.calculatedMargin} emphasized={sortBy === "ebitdaMargin"} bordered />
            <GrowthCell value={item.revenueGrowth} emphasized={sortBy === "revenueGrowth"} />
            <GrowthCell value={item.ebitdaGrowth} />
            <GrowthCell value={item.netProfitGrowth} />
          </tr>)}</tbody>
        </table>
      </div>
    </> : <EmptyChart text="当前项目尚未披露可用于横向比较的财务数据。" />}
  </ChartFrame>;
}

function FinancialSummary({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="bg-paper px-4 py-3"><div className="text-[10px] font-semibold tracking-[0.08em] text-subtle">{label}</div><div className="tabular mt-2 text-xl font-semibold text-ink">{value}</div><div className="mt-1 text-[10px] text-subtle">{note}</div></div>;
}

function MoneyCell({ value, emphasized, bordered }: { value: number | null; emphasized?: boolean; bordered?: boolean }) {
  return <td className={`tabular px-3 py-3 text-right ${bordered ? "border-r border-line" : ""} ${value === null ? "text-subtle" : emphasized ? "font-semibold text-blue" : "text-ink"}`}>{value === null ? "—" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}</td>;
}

function PercentCell({ value, emphasized, bordered }: { value: number | null; emphasized?: boolean; bordered?: boolean }) {
  return <td className={`tabular px-3 py-3 text-right ${bordered ? "border-r border-line" : ""} ${value === null ? "text-subtle" : emphasized ? "font-semibold text-gold" : "text-ink"}`}>{formatPercent(value)}</td>;
}

function GrowthCell({ value, emphasized }: { value: number | null; emphasized?: boolean }) {
  if (value === null) return <td className="px-3 py-3 text-right text-subtle">—</td>;
  const tone = value > 0 ? "border-[#0C4E98]/25 bg-[#0C4E98]/5 text-blue" : value < 0 ? "border-[#A10000]/25 bg-[#A10000]/5 text-oxblood" : "border-line bg-paper text-muted";
  return <td className="px-3 py-3 text-right"><span className={`tabular inline-flex min-w-16 justify-end border px-2 py-1 ${tone} ${emphasized ? "font-semibold" : ""}`}>{formatPercent(value, true)}</span></td>;
}

function ChartFrame({ title, note, wide, children }: { title: string; note: string; wide?: boolean; children: React.ReactNode }) { return <section className={`border border-line bg-surface p-5 shadow-[0_10px_30px_rgba(64,64,64,0.03)] ${wide ? "xl:col-span-2" : ""}`}><h3 className="text-lg font-semibold text-ink">{title}</h3><p className="mt-1 text-xs leading-5 text-subtle">{note}</p><div className="mt-4">{children}</div></section>; }
function EmptyChart({ text = "结构化项目增加后，这里将自动生成统计图表。" }: { text?: string }) { return <div className="flex h-[300px] items-center justify-center border border-dashed border-line bg-paper px-6 text-center text-sm text-muted">{text}</div>; }
function group(values: string[]) { const counts = new Map<string, number>(); values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1)); return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }
function hasFinancialProfile(item: TeaserOpportunityView) { return item.revenueUsd !== null || item.ebitdaUsd !== null || item.netProfitUsd !== null || item.ebitdaMargin !== null || item.revenueGrowth !== null || item.ebitdaGrowth !== null || item.netProfitGrowth !== null; }
function financialSortValue(item: TeaserOpportunityView & { calculatedMargin: number | null }, sortBy: FinancialSortKey) { return sortBy === "ebitdaMargin" ? item.calculatedMargin : item[sortBy]; }
function isNumber(value: number | null): value is number { return value !== null && Number.isFinite(value); }
function median(values: number[]) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }
function formatUsdSummary(value: number | null) { return value === null ? "—" : `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}m`; }
function formatPercent(value: number | null, signed = false) { if (value === null) return "—"; return `${signed && value > 0 ? "+" : ""}${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`; }
const tooltipStyle = { border: "1px solid #D9D5CE", borderRadius: 0, background: "#FFFDF9", color: "#404040", fontSize: 12 };
