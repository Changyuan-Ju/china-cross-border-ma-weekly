"use client";

import { useId, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const labels = {
  include: "建议纳入",
  exclude: "建议排除"
};

export function SuggestionButton({ targetType, targetId, targetTitle }: { targetType: string; targetId: string; targetTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [requestedAction, setRequestedAction] = useState("include");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/moderation-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType, targetId, requestedAction, reason, website: "" })
      });
      if (response.ok) {
        setMessage("建议已进入周五自动核验队列；系统将核对底层披露并自动决定纳入或排除。");
        setReason("");
      } else if (response.status === 429) {
        setError("提交较频繁，请稍后再试。");
      } else {
        setError("提交失败，请确认理由不少于 4 个字符。");
      }
    } catch {
      setError("网络连接异常，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setError("");
          setMessage("");
        }}
        aria-expanded={open}
        aria-controls={dialogId}
        className="focus-ring min-h-10 border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-gold hover:text-ink"
      >
        提出调整建议
      </button>
      {open ? (
        <form
          id={dialogId}
          role="dialog"
          aria-labelledby={titleId}
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="fixed inset-x-3 bottom-3 z-40 max-h-[calc(100vh-24px)] overflow-y-auto border border-line bg-surface p-4 shadow-lg md:absolute md:inset-auto md:right-0 md:mt-2 md:w-96"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
            <div>
              <div id={titleId} className="text-sm font-semibold leading-6 text-ink">提出调整建议</div>
              {targetTitle ? <p className="mt-1 text-xs leading-5 text-muted">{targetTitle}</p> : null}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭建议窗口" className="focus-ring -mr-1 shrink-0 p-2 text-muted hover:text-ink">
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <label className="mt-3 block text-sm font-medium text-ink" htmlFor={`${dialogId}-action`}>
            建议操作
          </label>
          <select id={`${dialogId}-action`} className="focus-ring mt-2 w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm" value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} required>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-ink" htmlFor={`${dialogId}-reason`}>
            判断依据 <span className="text-oxblood">*</span>
          </label>
          <p id={`${dialogId}-help`} className="mt-1 text-xs leading-5 text-subtle">请说明具体字段、正确口径及可核验依据。</p>
          <textarea
            id={`${dialogId}-reason`}
            aria-describedby={`${dialogId}-help`}
            className="focus-ring mt-2 min-h-28 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm leading-6"
            maxLength={800}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
          <input className="hidden" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs leading-5 text-subtle">每周五 22:00 自动核验</p>
            <button disabled={busy || reason.trim().length < 4} className="focus-ring min-h-10 border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white hover:border-gold disabled:opacity-60" type="submit">
              {busy ? "提交中…" : "提交建议"}
            </button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error ? <p className="mt-3 text-sm leading-6 text-oxblood">{error}</p> : null}
            {message ? (
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted">
                <CheckCircle2 aria-hidden="true" size={17} className="mt-1 shrink-0 text-blue" />
                {message}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
