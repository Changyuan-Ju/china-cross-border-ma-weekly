"use client";

import dynamic from "next/dynamic";
import { upload } from "@vercel/blob/client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpenText,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  Globe2,
  Grid2X2,
  Languages,
  List,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  X
} from "lucide-react";
import type { TeaserDashboardData, TeaserDocumentView, TeaserOpportunityView } from "@/lib/teasers/types";
import { INDUSTRY_CATEGORIES, REGION_CATEGORIES } from "@/lib/teasers/taxonomy";

const TeaserCharts = dynamic(() => import("./TeaserCharts").then((module) => module.TeaserCharts), {
  ssr: false,
  loading: () => <div className="flex min-h-72 items-center justify-center border border-line bg-surface text-sm text-muted"><LoaderCircle className="mr-2 animate-spin" size={16} />正在生成数据洞察…</div>
});

type Tab = "library" | "insights";
type View = "cards" | "table";

const statusLabels: Record<string, string> = {
  queued: "等待解析",
  processing: "正在解析",
  completed: "已入库",
  configuration_required: "待配置",
  failed: "解析失败"
};

export function TeaserWorkspace({ initialData, username }: { initialData: TeaserDashboardData; username: string }) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<Tab>("library");
  const [view, setView] = useState<View>("cards");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [selected, setSelected] = useState<TeaserOpportunityView | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const allDocuments = useMemo(() => [...data.opportunities.flatMap((item) => item.documents), ...data.orphanDocuments], [data]);
  const processingCount = allDocuments.filter((item) => ["queued", "processing"].includes(item.status)).length;
  const newThisMonth = allDocuments.filter((item) => Date.now() - new Date(item.uploadedAt).getTime() <= 30 * 86400000).length;
  const financialCount = data.opportunities.filter((item) => item.revenueUsd !== null || item.ebitdaUsd !== null || item.netProfitUsd !== null).length;
  const industries = orderedUnique(data.opportunities.map((item) => item.industry), INDUSTRY_CATEGORIES);
  const regions = orderedUnique(data.opportunities.map((item) => item.region), REGION_CATEGORIES);

  const filtered = useMemo(() => data.opportunities.filter((item) => {
    const haystack = [
      item.title, item.projectCode, item.country, item.region, item.industry, item.subsector,
      item.businessSummary, item.industryOverview, item.companyOverview, item.productOverview,
      item.advisor, item.advisorContactName, ...item.operatingLocations, ...item.companyHighlights, ...item.tags
    ].filter(Boolean).join(" ").toLowerCase();
    return (!deferredQuery || haystack.includes(deferredQuery.toLowerCase()))
      && (!industry || item.industry === industry)
      && (!region || (item.region || item.country) === region);
  }), [data.opportunities, deferredQuery, industry, region]);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/teasers", { cache: "no-store" });
      if (response.ok) {
        const next = await response.json() as TeaserDashboardData;
        setData(next);
        if (selected) setSelected(next.opportunities.find((item) => item.id === selected.id) ?? null);
      }
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!processingCount) return;
    const timer = window.setInterval(refresh, 12_000);
    return () => window.clearInterval(timer);
  }, [processingCount]);

  async function logout() {
    await fetch("/api/teasers/auth/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="min-h-[calc(100vh-97px)] bg-paper pb-16">
      <section className="border-b border-line bg-surface">
        <div className="h-1 bg-blue" />
        <div className="shell py-7 md:py-9">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold"><Sparkles size={14} />专项资料库</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Teaser 项目资料智库</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">面向非标准化项目资料的结构化检索、标的画像与组合洞察。公司名称未披露不影响入库和分析。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex min-h-10 items-center gap-2 border border-line bg-paper px-3 text-xs text-muted"><ShieldCheck size={15} className="text-blue" />{username}</div>
              <button onClick={refresh} className="focus-ring inline-flex min-h-10 items-center gap-2 border border-line bg-surface px-3 text-sm text-muted hover:border-gold hover:text-ink"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />刷新</button>
              <button onClick={() => setUploadOpen(true)} className="focus-ring inline-flex min-h-10 items-center gap-2 border border-blue bg-blue px-4 text-sm font-semibold text-white hover:bg-blue2"><Plus size={16} />新增资料</button>
              <button onClick={logout} className="focus-ring inline-flex min-h-10 items-center border border-line bg-surface px-3 text-muted hover:border-oxblood hover:text-oxblood" aria-label="退出登录"><LogOut size={15} /></button>
            </div>
          </div>
        </div>
      </section>

      <div className="shell pt-6">
        {!data.databaseReady ? <div className="mb-5 border-l-2 border-oxblood bg-surface p-4 text-sm text-oxblood">资料库暂时无法连接，请稍后刷新。</div> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="项目档案" value={data.opportunities.length} note="按项目代号与资料版本归集" icon={<Database size={17} />} />
          <Metric label="近30日新增文件" value={newThisMonth} note={`当前共 ${allDocuments.length} 份文件`} icon={<CalendarDays size={17} />} />
          <Metric label="已披露财务数据" value={financialCount} note="统一换算为百万美元" icon={<BarChart3 size={17} />} />
          <Metric label="正在解析" value={processingCount} note={processingCount ? "状态将自动更新" : "当前处理队列已完成"} icon={processingCount ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} />
        </div>

        <nav className="mt-7 flex border-b border-line" aria-label="Teaser资料库导航">
          <TabButton active={tab === "library"} onClick={() => setTab("library")} icon={<Database size={15} />} label="项目资料库" count={data.opportunities.length} />
          <TabButton active={tab === "insights"} onClick={() => setTab("insights")} icon={<BarChart3 size={15} />} label="数据洞察" />
        </nav>

        {tab === "library" ? <section className="pt-5">
          <div className="border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(64,64,64,0.035)]">
            <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
              <label className="flex items-center gap-2 border border-line bg-paper px-3 py-2.5 focus-within:border-gold">
                <Search size={16} className="text-muted" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="搜索标题、项目代号、行业、区域、顾问或关键词" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <FilterSelect label="全部行业" value={industry} options={industries} onChange={setIndustry} />
              <FilterSelect label="全部总部区域" value={region} options={regions} onChange={setRegion} />
              <div className="flex border border-line bg-paper">
                <ViewButton active={view === "cards"} onClick={() => setView("cards")} label="卡片视图"><Grid2X2 size={15} /></ViewButton>
                <ViewButton active={view === "table"} onClick={() => setView("table")} label="表格视图"><List size={16} /></ViewButton>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-subtle">
              <span>显示 {filtered.length} 个项目</span>
              {(query || industry || region) ? <button className="text-blue hover:underline" onClick={() => { setQuery(""); setIndustry(""); setRegion(""); }}>清除筛选</button> : null}
            </div>
          </div>

          {data.orphanDocuments.length ? <ProcessingQueue documents={data.orphanDocuments} onRefresh={refresh} /> : null}
          {view === "cards" ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <OpportunityCard key={item.id} item={item} onClick={() => setSelected(item)} />)}</div> : <OpportunityTable items={filtered} onSelect={setSelected} />}
          {!filtered.length ? <EmptyState onUpload={() => setUploadOpen(true)} /> : null}
        </section> : null}

        {tab === "insights" ? <section className="pt-5">
          <div className="mb-4 border border-line bg-surface p-5">
            <h2 className="text-xl font-semibold text-ink">组合数据洞察</h2>
            <p className="mt-1 text-xs leading-5 text-muted">总部区域、行业与财务分布均基于已提取字段；财务图表仅纳入有披露数据的项目，并统一使用美元口径。</p>
          </div>
          <TeaserCharts opportunities={data.opportunities} onSelectOpportunity={setSelected} />
        </section> : null}
      </div>

      {uploadOpen ? <UploadDrawer onClose={() => setUploadOpen(false)} onComplete={refresh} /> : null}
      {selected ? <OpportunityDrawer item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function Metric({ label, value, note, icon }: { label: string; value: number; note: string; icon: React.ReactNode }) {
  return <div className="border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(64,64,64,0.025)]"><div className="flex items-center gap-2 text-xs font-medium text-muted">{icon}{label}</div><div className="tabular mt-3 text-3xl font-semibold text-ink">{value}</div><div className="mt-1 text-[11px] text-subtle">{note}</div></div>;
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return <button onClick={onClick} className={`focus-ring flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${active ? "border-blue text-blue" : "border-transparent text-muted hover:border-gold hover:text-ink"}`}>{icon}{label}{typeof count === "number" ? <span className="tabular bg-[#D9D9D9] px-1.5 py-0.5 text-[10px] text-ink">{count}</span> : null}</button>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <select aria-label={label} className="focus-ring border border-line bg-paper px-3 py-2.5 text-sm text-ink hover:border-gold" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return <button aria-label={label} title={label} onClick={onClick} className={`focus-ring px-3 ${active ? "bg-blue text-white" : "text-muted hover:text-blue"}`}>{children}</button>;
}

function OpportunityCard({ item, onClick }: { item: TeaserOpportunityView; onClick: () => void }) {
  const latest = item.documents[0];
  return <button onClick={onClick} className="focus-ring group relative flex min-h-72 flex-col overflow-hidden border border-line bg-surface p-5 text-left shadow-[0_10px_30px_rgba(64,64,64,0.03)] hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_16px_38px_rgba(64,64,64,0.07)]">
    <div className="absolute inset-x-0 top-0 h-0.5 bg-blue opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="flex items-start justify-between gap-3"><div className="text-[10px] font-bold tracking-[0.16em] text-gold">{item.projectCode || "未披露项目代号"}</div><StatusBadge status={latest?.status || "completed"} /></div>
    <h3 className="mt-4 text-xl font-semibold leading-7 text-ink group-hover:text-blue">{item.title}</h3>
    <p className="mt-2 line-clamp-3 text-xs leading-6 text-muted">{item.businessSummary || item.companyOverview || "结构化项目概况待补充。"}</p>
    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-3 text-xs"><DataPoint label="收入" value={formatUsd(item.revenueUsd)} /><DataPoint label="EBITDA" value={formatUsd(item.ebitdaUsd)} /><DataPoint label="净利润" value={formatUsd(item.netProfitUsd)} /></div>
    <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 pt-4 text-[11px] text-subtle"><Meta icon={<Building2 size={12} />} value={item.industry || "行业未披露"} /><Meta icon={<Globe2 size={12} />} value={item.region || item.country || "总部区域未披露"} /><Meta icon={<FileText size={12} />} value={latest?.documentType || "Teaser"} /><Meta icon={<Languages size={12} />} value={latest?.language || "语言待识别"} /></div>
  </button>;
}

function OpportunityTable({ items, onSelect }: { items: TeaserOpportunityView[]; onSelect: (item: TeaserOpportunityView) => void }) {
  return <div className="mt-5 overflow-x-auto border border-line bg-surface"><table className="w-full min-w-[1050px] border-collapse text-left text-xs"><thead className="border-b border-line bg-[#F1F1F1] text-muted"><tr>{["Teaser标题", "项目代号", "行业", "总部区域", "文件类型", "收入(USDm)", "EBITDA(USDm)", "接收日期"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-line">{items.map((item) => { const latest = item.documents[0]; return <tr key={item.id} onClick={() => onSelect(item)} className="cursor-pointer hover:bg-paper"><td className="max-w-xs px-4 py-3 font-semibold text-ink">{item.title}</td><td className="px-4 py-3 text-muted">{item.projectCode || "—"}</td><td className="px-4 py-3 text-muted">{item.industry || "—"}</td><td className="px-4 py-3 text-muted">{item.region || item.country || "—"}</td><td className="px-4 py-3 text-muted">{latest?.documentType || "—"}</td><td className="tabular px-4 py-3 text-ink">{numberOnly(item.revenueUsd)}</td><td className="tabular px-4 py-3 text-ink">{numberOnly(item.ebitdaUsd)}</td><td className="px-4 py-3 text-subtle">{latest ? formatDate(latest.uploadedAt) : "—"}</td></tr>; })}</tbody></table></div>;
}

function ProcessingQueue({ documents, onRefresh }: { documents: TeaserDocumentView[]; onRefresh: () => Promise<void> }) {
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function retry(documentId: string) {
    setRetryingId(documentId);
    try {
      const response = await fetch(`/api/teasers/process/${documentId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force: true })
      });
      if (!response.ok) throw new Error("retry_failed");
      await onRefresh();
    } finally {
      setRetryingId(null);
    }
  }

  return <div className="mt-5 border border-line bg-surface p-4">
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-ink">文件处理队列</h3><p className="mt-1 text-xs text-muted">新文件完成解析后会自动归入项目档案。</p></div><button className="text-xs text-blue hover:underline" onClick={onRefresh}>刷新状态</button></div>
    <div className="mt-3 divide-y divide-line border-t border-line">{documents.slice(0, 10).map((document) => <div key={document.id} className="flex flex-col gap-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><div className="truncate font-medium text-ink">{document.fileName}</div><div className="mt-1 text-subtle">{formatBytes(document.fileSize)} · {formatDate(document.uploadedAt, true)}</div>{document.status === "failed" ? <div className="mt-1 text-[11px] text-oxblood">{friendlyExtractionError(document.errorMessage)}</div> : null}</div>
      <div className="flex shrink-0 items-center gap-2"><StatusBadge status={document.status} />{document.status === "failed" ? <button disabled={retryingId === document.id} onClick={() => retry(document.id)} className="focus-ring inline-flex items-center gap-1 border border-line px-2 py-1 text-[10px] font-semibold text-blue hover:border-blue disabled:opacity-50"><RefreshCw size={11} className={retryingId === document.id ? "animate-spin" : ""} />{retryingId === document.id ? "正在重试" : "重新解析"}</button> : null}</div>
    </div>)}</div>
  </div>;
}

function UploadDrawer({ onClose, onComplete }: { onClose: () => void; onComplete: () => Promise<void> }) {
  const [mode, setMode] = useState<"files" | "url">("files");
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileStatuses, setFileStatuses] = useState<Record<string, string>>({});

  function fileKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  function setFileStatus(file: File, status: string) {
    setFileStatuses((current) => ({ ...current, [fileKey(file)]: status }));
  }

  async function uploadDirect(file: File) {
    setFileStatus(file, "正在上传");
    const pathname = `teasers/pending/${crypto.randomUUID()}/${safeUploadFileName(file.name)}`;
    const blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/teasers/upload-token",
      contentType: file.type || "application/octet-stream",
      multipart: true
    });
    setFileStatus(file, "正在登记");
    const response = await fetch("/api/teasers/upload-register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pathname: blob.pathname, fileName: file.name, mimeType: file.type })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "upload_registration_failed");
    setFileStatus(file, body.duplicate ? "已存在" : "等待解析");
    return body as { duplicate?: boolean };
  }

  async function uploadThroughServer(selectedFiles: File[]) {
    const form = new FormData();
    selectedFiles.forEach((file) => { form.append("files", file); setFileStatus(file, "正在上传"); });
    const response = await fetch("/api/teasers/upload", { method: "POST", body: form });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "upload_failed");
    body.items.forEach((item: { fileName: string; duplicate?: boolean; error?: string }) => {
      const file = selectedFiles.find((candidate) => candidate.name === item.fileName);
      if (file) setFileStatus(file, item.error ? "上传失败" : item.duplicate ? "已存在" : "等待解析");
    });
    return body.items as Array<{ duplicate?: boolean; error?: string }>;
  }

  async function uploadFiles() {
    if (!files.length) return;
    setBusy(true); setError(""); setMessage("");
    setFileStatuses({});
    try {
      const capability = await fetch("/api/teasers/upload-token", { cache: "no-store" });
      const capabilityBody = capability.ok ? await capability.json() as { directUpload?: boolean } : { directUpload: false };
      let results: Array<{ duplicate?: boolean; error?: string }>;
      if (capabilityBody.directUpload) {
        const settled = await Promise.allSettled(files.map(uploadDirect));
        results = settled.map((result, index) => {
          if (result.status === "fulfilled") return result.value;
          setFileStatus(files[index], "上传失败");
          return { error: result.reason instanceof Error ? result.reason.message : "upload_failed" };
        });
      } else {
        results = await uploadThroughServer(files);
      }
      const duplicates = results.filter((item) => item.duplicate).length;
      const failures = results.filter((item) => item.error).length;
      const accepted = results.length - failures;
      setMessage(`已接收 ${accepted} 份文件${duplicates ? `，其中 ${duplicates} 份已存在` : ""}${failures ? `；${failures} 份上传失败` : ""}。${accepted - duplicates ? "解析将在后台完成。" : ""}`);
      if (failures) setError("部分文件未能上传，可保留当前列表后重试。");
      else setFiles([]);
      await onComplete();
    } catch { setError("上传失败，请检查文件格式、大小或网络连接。"); } finally { setBusy(false); }
  }

  async function importUrl() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/teasers/import-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "import_failed");
      setMessage(body.duplicate ? "该文件已存在，已定位到原记录。" : "链接文件已接收，解析将在后台完成。");
      setUrl(""); await onComplete();
    } catch { setError("链接导入失败，请确认地址可以直接访问文件。"); } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex justify-end bg-[#404040]/35" role="dialog" aria-modal="true" aria-label="新增Teaser资料"><button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="关闭" /><aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-line bg-surface shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5"><div><div className="text-[10px] font-bold tracking-[0.16em] text-gold">新增项目资料</div><h2 className="mt-1 text-xl font-semibold text-ink">上传并自动结构化</h2></div><button className="focus-ring p-2 text-muted hover:text-ink" onClick={onClose} aria-label="关闭"><X size={19} /></button></div><div className="p-6"><div className="grid grid-cols-2 border border-line bg-paper p-1 text-xs"><ModeButton active={mode === "files"} onClick={() => setMode("files")} icon={<UploadCloud size={14} />}>文件上传</ModeButton><ModeButton active={mode === "url"} onClick={() => setMode("url")} icon={<ExternalLink size={14} />}>链接导入</ModeButton></div>
    {mode === "files" ? <div className="mt-6"><label className="flex min-h-52 cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-paper px-6 text-center hover:border-gold"><UploadCloud className="text-blue" size={28} /><span className="mt-4 text-sm font-semibold text-ink">选择或拖放Teaser文件</span><span className="mt-2 text-xs leading-5 text-muted">一次最多5份；支持 PDF、PPT、Word、Excel 和扫描图片；单个文件不超过25MB。</span><input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => { const selected = Array.from(event.target.files ?? []); setFiles(selected.slice(0, 5)); setFileStatuses({}); setMessage(""); setError(selected.length > 5 ? "一次最多上传5份文件，已为你保留前5份。" : ""); event.target.value = ""; }} /></label>{files.length ? <div className="mt-4 divide-y divide-line border border-line px-4">{files.map((file) => <div key={fileKey(file)} className="flex items-center justify-between gap-3 py-3 text-xs"><span className="min-w-0 truncate text-ink">{file.name}</span><span className="flex shrink-0 items-center gap-3 text-subtle"><span>{formatBytes(file.size)}</span>{fileStatuses[fileKey(file)] ? <span className="font-medium text-blue">{fileStatuses[fileKey(file)]}</span> : null}</span></div>)}</div> : null}<button disabled={busy || !files.length} onClick={uploadFiles} className="focus-ring mt-5 w-full border border-blue bg-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "正在安全上传…" : `上传并解析${files.length ? `（${files.length}/5）` : ""}`}</button></div> : null}
    {mode === "url" ? <div className="mt-6"><label className="text-sm font-medium text-ink" htmlFor="teaser-url">文件地址</label><p className="mt-1 text-xs leading-5 text-muted">仅接受可直接访问的 HTTPS 文件链接，系统会保留原始来源。</p><input id="teaser-url" type="url" className="focus-ring mt-3 w-full border border-line bg-paper px-3 py-3 text-sm" placeholder="https://example.com/project-teaser.pdf" value={url} onChange={(event) => setUrl(event.target.value)} /><button disabled={busy || !url} onClick={importUrl} className="focus-ring mt-5 w-full border border-blue bg-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "正在获取文件…" : "导入并解析"}</button></div> : null}
    <div aria-live="polite">{message ? <p className="mt-5 border-l-2 border-blue pl-3 text-sm leading-6 text-muted">{message}</p> : null}{error ? <p className="mt-5 border-l-2 border-oxblood pl-3 text-sm leading-6 text-oxblood">{error}</p> : null}</div></div></aside></div>;
}

function safeUploadFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "-").replace(/-+/g, "-").slice(-140) || "teaser-file";
}

function OpportunityDrawer({ item, onClose }: { item: TeaserOpportunityView; onClose: () => void }) {
  const latest = item.documents[0];
  const hasContact = item.advisorContactName || item.advisorContactEmail || item.advisorContactPhone;
  return <div className="fixed inset-0 z-50 flex justify-end bg-[#404040]/35" role="dialog" aria-modal="true" aria-label={item.title}><button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="关闭" /><aside className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-line bg-surface shadow-2xl"><div className="sticky top-0 z-10 border-b border-line bg-surface px-6 py-5"><div className="flex items-start justify-between gap-5"><div><div className="text-[10px] font-bold tracking-[0.16em] text-gold">{item.projectCode || "项目代号未披露"}</div><h2 className="mt-1 text-2xl font-semibold leading-8 text-ink">{item.title}</h2></div><button className="focus-ring p-2 text-muted hover:text-ink" onClick={onClose} aria-label="关闭"><X size={19} /></button></div></div><div className="p-6">
    <div className="flex flex-wrap gap-2">{item.industry ? <Tag>{item.industry}</Tag> : null}{item.subsector ? <Tag>{item.subsector}</Tag> : null}{item.region || item.country ? <Tag>{item.region || item.country}</Tag> : null}</div>
    <p className="mt-5 text-sm leading-7 text-muted">{item.businessSummary || item.companyOverview || "项目概况尚未披露。"}</p>
    <section className="mt-7"><SectionTitle icon={<FileSearch size={17} />} title="资料信息" /><dl className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3"><Fact label="项目代号" value={item.projectCode} /><Fact label="文件类型" value={latest?.documentType} /><Fact label="文件语言" value={latest?.language} /><Fact label="文件日期" value={latest?.documentDate ? formatDate(latest.documentDate) : null} /><Fact label="接收日期" value={latest ? formatDate(latest.uploadedAt, true) : null} /><Fact label="卖方顾问" value={item.advisor} /></dl></section>
    {hasContact ? <section className="mt-7"><SectionTitle icon={<UserRound size={17} />} title="顾问联系人" /><div className="mt-3 grid gap-3 border border-line bg-paper p-4 sm:grid-cols-3"><ContactItem icon={<UserRound size={14} />} label="姓名" value={item.advisorContactName} /><ContactItem icon={<Mail size={14} />} label="邮箱" value={item.advisorContactEmail} href={item.advisorContactEmail ? `mailto:${item.advisorContactEmail}` : undefined} /><ContactItem icon={<Phone size={14} />} label="电话" value={item.advisorContactPhone} /></div></section> : null}
    <section className="mt-7"><SectionTitle icon={<BarChart3 size={17} />} title="财务信息（百万美元）" /><div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3"><DetailMetric label="收入" value={formatUsd(item.revenueUsd)} growth={item.revenueGrowth} /><DetailMetric label="EBITDA" value={formatUsd(item.ebitdaUsd)} growth={item.ebitdaGrowth} /><DetailMetric label="净利润" value={formatUsd(item.netProfitUsd)} growth={item.netProfitGrowth} /></div>{item.fxRateToUsd && item.currency ? <p className="mt-2 text-[11px] text-subtle">原始币种：{item.currency}；按 {item.fxRateDate ? formatDate(item.fxRateDate) : "入库日"} 参考汇率换算，1 {item.currency} = {item.fxRateToUsd.toFixed(4)} USD。</p> : <p className="mt-2 text-[11px] text-subtle">仅展示资料中已披露且可完成美元换算的财务数据。</p>}</section>
    <NarrativeSection title="行业概况" value={item.industryOverview} />
    <NarrativeSection title="公司介绍" value={item.companyOverview} />
    <NarrativeSection title="产品与服务" value={item.productOverview} />
    {item.operatingLocations.length ? <section className="mt-7"><SectionTitle icon={<MapPin size={17} />} title="运营地点" /><div className="mt-3 flex flex-wrap gap-2">{item.operatingLocations.map((location) => <Tag key={location}>{location}</Tag>)}</div></section> : null}
    {item.companyHighlights.length ? <section className="mt-7"><SectionTitle icon={<Sparkles size={17} />} title="公司亮点" /><ul className="mt-3 grid gap-2">{item.companyHighlights.map((highlight) => <li key={highlight} className="border-l-2 border-gold bg-paper px-4 py-3 text-sm leading-6 text-muted">{highlight}</li>)}</ul></section> : null}
    <section className="mt-7"><SectionTitle icon={<FileText size={17} />} title="原始文件" /><div className="mt-3 divide-y divide-line border border-line">{item.documents.map((document) => <div key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="truncate text-sm font-medium text-ink">{document.fileName}</div><div className="mt-1 text-[11px] text-subtle">{document.versionLabel || "版本待确认"} · {document.documentType || "资料"} · {formatDate(document.uploadedAt, true)}</div></div><div className="flex items-center gap-2"><StatusBadge status={document.status} />{document.originalUrl ? <a className="focus-ring inline-flex items-center gap-1 border border-line px-2.5 py-2 text-xs text-blue hover:border-blue" href={document.originalUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} />来源链接</a> : null}<a className="focus-ring inline-flex items-center gap-1 border border-line px-2.5 py-2 text-xs text-blue hover:border-blue" href={`/api/teasers/download/${document.id}`} target="_blank" rel="noreferrer"><Download size={13} />查看原件</a></div></div>)}</div></section>
    {item.tags.length ? <section className="mt-7"><h3 className="text-sm font-semibold text-ink">关键词</h3><div className="mt-3 flex flex-wrap gap-2">{item.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div></section> : null}
  </div></aside></div>;
}

function NarrativeSection({ title, value }: { title: string; value: string | null }) { if (!value) return null; return <section className="mt-7"><SectionTitle icon={<BookOpenText size={17} />} title={title} /><p className="mt-3 whitespace-pre-line border border-line bg-paper p-4 text-sm leading-7 text-muted">{value}</p></section>; }
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <h3 className="flex items-center gap-2 text-base font-semibold text-ink"><span className="text-blue">{icon}</span>{title}</h3>; }
function Fact({ label, value }: { label: string; value: string | null | undefined }) { return <div className="bg-surface p-4"><dt className="text-[11px] text-subtle">{label}</dt><dd className="mt-1.5 text-sm font-medium text-ink">{value || "未披露"}</dd></div>; }
function ContactItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | null; href?: string }) { return <div><div className="flex items-center gap-1.5 text-[11px] text-subtle">{icon}{label}</div>{href && value ? <a href={href} className="mt-1 block break-all text-sm font-medium text-blue hover:underline">{value}</a> : <div className="mt-1 break-all text-sm font-medium text-ink">{value || "未披露"}</div>}</div>; }
function DetailMetric({ label, value, growth }: { label: string; value: string; growth: number | null }) { return <div className="bg-paper p-4"><div className="text-[10px] text-subtle">{label}</div><div className="tabular mt-2 text-lg font-semibold text-ink">{value}</div><div className={`tabular mt-1 text-[11px] ${growth === null ? "text-subtle" : growth >= 0 ? "text-blue" : "text-oxblood"}`}>{growth === null ? "增速未披露" : `同比 ${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}</div></div>; }
function Meta({ icon, value }: { icon: React.ReactNode; value: string }) { return <span className="flex min-w-0 items-center gap-1.5"><span className="shrink-0 text-blue">{icon}</span><span className="truncate">{value}</span></span>; }
function DataPoint({ label, value }: { label: string; value: string }) { return <div><div className="text-[10px] text-subtle">{label}</div><div className="tabular mt-1 font-semibold text-ink">{value}</div></div>; }
function ModeButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) { return <button onClick={onClick} className={`focus-ring flex items-center justify-center gap-1.5 px-2 py-2.5 ${active ? "bg-surface font-semibold text-blue shadow-sm" : "text-muted hover:text-ink"}`}>{icon}{children}</button>; }
function StatusBadge({ status }: { status: string }) { const danger = status === "failed"; const active = status === "completed"; return <span className={`inline-flex shrink-0 items-center gap-1 border px-2 py-1 text-[10px] font-semibold ${danger ? "border-[#A10000]/30 bg-[#A10000]/5 text-oxblood" : active ? "border-[#0C4E98]/30 bg-[#0C4E98]/5 text-blue" : "border-line bg-paper text-muted"}`}>{active ? <CheckCircle2 size={11} strokeWidth={2} /> : null}{statusLabels[status] || status}</span>; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="border border-line bg-paper px-2.5 py-1 text-[10px] text-muted">{children}</span>; }
function EmptyState({ onUpload }: { onUpload: () => void }) { return <div className="mt-5 border border-line bg-surface p-12 text-center"><Database className="mx-auto text-blue" size={30} /><h3 className="mt-4 text-lg font-semibold text-ink">暂无符合条件的项目</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">上传一份Teaser或清除当前筛选条件。</p><button onClick={onUpload} className="focus-ring mt-5 inline-flex items-center gap-2 border border-blue bg-blue px-4 py-2.5 text-sm font-semibold text-white"><Plus size={15} />新增资料</button></div>; }
function orderedUnique(values: Array<string | null>, order: readonly string[]) {
  const available = new Set(values.filter(Boolean) as string[]);
  return order.filter((value) => available.has(value));
}
function formatDate(value: string, includeTime = false) { const date = new Date(value); return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date); }
function formatUsd(value: number | null) { return value === null ? "—" : `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}m`; }
function numberOnly(value: number | null) { return value === null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value); }
function formatBytes(value: number) { if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
function friendlyExtractionError(value: string | null) {
  if (!value) return "解析未完成，请重新尝试。";
  if (/timed?\s*out|timeout|aborted/i.test(value)) return "云端解析超时，系统已延长处理时间，可直接重新解析。";
  if (/parsing did not finish|parsing in progress/i.test(value)) return "阿里云仍在处理文件，可稍后重新解析。";
  if (/returned no JSON|structured output|validation/i.test(value)) return "结构化结果不完整，请重新解析。";
  return "解析未完成，请重新尝试。";
}
