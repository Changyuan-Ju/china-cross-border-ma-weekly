"use client";

import { SlidersHorizontal, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function Filters({ countries, industries, stages, resultCount }: { countries: string[]; industries: string[]; stages: string[]; resultCount?: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/deals?${next.toString()}`);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    update("q", query);
  }

  const activeCount = ["country", "industry", "stage", "status"].filter((key) => params.get(key) && !(key === "status" && params.get(key) === "已纳入")).length + (params.get("q") ? 1 : 0);

  return (
    <form onSubmit={submit} className="border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-medium text-ink">结果：<span className="tabular">{resultCount ?? 0}</span> 条</div>
        <Link className="focus-ring inline-flex items-center gap-1 border border-line px-3 py-1.5 text-muted hover:border-gold hover:text-ink" href="/deals">
          <X size={14} /> 清除筛选
        </Link>
      </div>
      <details className="md:contents" open>
        <summary className="mb-3 flex cursor-pointer items-center gap-2 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink md:hidden">
          <SlidersHorizontal size={16} /> 筛选 {activeCount ? `（${activeCount}）` : ""}
        </summary>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <label className="focus-within:border-gold flex items-center gap-2 border border-line bg-paper px-3 py-2">
          <Search size={16} className="text-muted" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="搜索公司、证券代码、标的或正文" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <Select label="国家/地区" value={params.get("country") ?? ""} options={countries} onChange={(value) => update("country", value)} />
        <Select label="行业" value={params.get("industry") ?? ""} options={industries} onChange={(value) => update("industry", value)} />
        <Select label="阶段" value={params.get("stage") ?? ""} options={stages} onChange={(value) => update("stage", value)} />
        <Select
          label="状态"
          value={params.get("status") ?? "已纳入"}
          options={[
            "已纳入",
            "待复核",
            "已排除"
          ]}
          onChange={(value) => update("status", value)}
        />
      </div>
      </details>
      <div className="mt-3 flex justify-end">
        <button className="focus-ring border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white hover:border-gold active:bg-ink" type="submit">
          搜索
        </button>
      </div>
    </form>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select aria-label={label} className="focus-ring w-full border border-line bg-paper px-3 py-2 text-sm text-ink hover:border-gold" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
