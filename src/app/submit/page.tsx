"use client";

import { useState } from "react";
import { CheckCircle2, FileSearch, Send, ShieldCheck } from "lucide-react";

const steps = [
  { icon: Send, title: "提交线索", text: "填写交易标题；如有公开公告，可一并粘贴链接。" },
  { icon: FileSearch, title: "自动核验", text: "每周五 22:00 核对公告原文、交易边界与重复记录。" },
  { icon: ShieldCheck, title: "规范入库", text: "符合口径的交易补齐字段后发布；证据不足的保留待复核。" }
];

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (title.trim().length < 4) {
      setError("标题至少需要 4 个字符。");
      return;
    }
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
      setError("公告链接需以 http:// 或 https:// 开头。");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/manual-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, sourceUrl, website: "" })
      });
      if (response.ok) {
        setMessage("线索已进入周五自动核验队列。符合收录口径的交易将补充入库，感谢协助完善周报。");
        setTitle("");
        setSourceUrl("");
      } else if (response.status === 429) {
        setError("提交较频繁，请稍后再试。");
      } else {
        setError("提交失败，请检查标题或链接格式。");
      }
    } catch {
      setError("网络连接异常，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs font-bold tracking-[0.18em] text-gold">SUBMIT A LEAD</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">补充交易</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          如果周报遗漏了一笔中资企业跨境并购，请提交标题或公开公告链接。系统会在每周五晚自动核验，不会未经核对直接改动正式数据库。
        </p>

        <ol className="mt-6 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {steps.map(({ icon: Icon, title: stepTitle, text }, index) => (
            <li key={stepTitle} className="bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon aria-hidden="true" size={17} className="text-gold" />
                <span className="tabular text-xs text-subtle">0{index + 1}</span>
                {stepTitle}
              </div>
              <p className="mt-2 text-xs leading-6 text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <form onSubmit={submit} className="mt-6 border border-line bg-surface p-5 md:p-6" noValidate>
          <label className="block text-sm font-medium text-ink" htmlFor="lead-title">
            交易标题 <span className="text-oxblood">*</span>
          </label>
          <p id="lead-title-help" className="mt-1 text-xs leading-5 text-subtle">建议包含买方、标的、股权比例或交易状态。</p>
          <input
            id="lead-title"
            className="focus-ring mt-2 w-full border border-line bg-paper px-3 py-2.5 text-sm hover:border-gold"
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：某公司拟收购境外标的 100% 股权"
            required
            aria-describedby="lead-title-help"
            aria-invalid={Boolean(error && title.trim().length < 4)}
          />

          <label className="mt-5 block text-sm font-medium text-ink" htmlFor="lead-url">
            公开公告链接 <span className="font-normal text-subtle">（可选）</span>
          </label>
          <p id="lead-url-help" className="mt-1 text-xs leading-5 text-subtle">优先使用交易所、巨潮资讯或公司投资者关系页面的直链。</p>
          <input
            id="lead-url"
            type="url"
            inputMode="url"
            className="focus-ring mt-2 w-full border border-line bg-paper px-3 py-2.5 text-sm hover:border-gold"
            maxLength={500}
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://"
            aria-describedby="lead-url-help"
          />
          <input className="hidden" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-subtle">请勿提交内部文件、客户信息或其他非公开资料。</p>
            <button disabled={busy} className="focus-ring min-h-10 shrink-0 border border-ink bg-ink px-5 py-2 text-sm font-semibold text-white hover:border-gold disabled:cursor-wait disabled:opacity-60" type="submit">
              {busy ? "提交中…" : "提交交易线索"}
            </button>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {error ? <p className="mt-4 border-l-2 border-oxblood pl-3 text-sm text-oxblood">{error}</p> : null}
            {message ? (
              <p className="mt-4 flex items-start gap-2 border-l-2 border-blue pl-3 text-sm leading-6 text-muted">
                <CheckCircle2 aria-hidden="true" size={17} className="mt-1 shrink-0 text-blue" />
                {message}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
