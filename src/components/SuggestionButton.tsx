"use client";

import { useState } from "react";

const labels = {
  include: "建议纳入",
  review_required: "建议转为待复核",
  exclude: "建议排除"
};

export function SuggestionButton({ targetType, targetId, targetTitle }: { targetType: string; targetId: string; targetTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [requestedAction, setRequestedAction] = useState("include");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/moderation-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetType, targetId, requestedAction, reason, website: "" })
    });
    setBusy(false);
    if (response.ok) {
      setMessage("建议已提交，需经管理员复核后方可调整。");
      setReason("");
    } else {
      setMessage("提交失败，请稍后再试。");
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="focus-ring border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-gold hover:text-ink">
        提出调整建议
      </button>
      {open ? (
        <form onSubmit={submit} className="fixed inset-x-3 bottom-3 z-40 border border-line bg-surface p-4 shadow-lg md:absolute md:inset-auto md:right-0 md:mt-2 md:w-96">
          {targetTitle ? <div className="mb-3 border-b border-line pb-3 text-sm font-semibold leading-6 text-ink">{targetTitle}</div> : null}
          <label className="block text-sm font-medium text-ink">
            建议操作
            <select className="focus-ring mt-2 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm" value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} required>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm font-medium text-ink">
            建议理由
            <textarea className="focus-ring mt-2 min-h-24 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm leading-6" maxLength={800} value={reason} onChange={(event) => setReason(event.target.value)} required />
          </label>
          <input className="hidden" tabIndex={-1} autoComplete="off" name="website" />
          <button disabled={busy || !reason.trim()} className="focus-ring mt-3 border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white hover:border-gold disabled:opacity-60" type="submit">
            {busy ? "提交中..." : "提交建议"}
          </button>
          {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
