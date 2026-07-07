"use client";

import { useState } from "react";

const labels = {
  include: "建议纳入",
  review_required: "建议转为待复核",
  exclude: "建议排除"
};

export function SuggestionButton({ targetType, targetId }: { targetType: string; targetId: string }) {
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
      <button type="button" onClick={() => setOpen((value) => !value)} className="focus-ring border border-line bg-white px-4 py-2 text-sm text-ink hover:border-blue hover:text-blue">
        提出调整建议
      </button>
      {open ? (
        <form onSubmit={submit} className="absolute right-0 z-10 mt-2 w-80 border border-line bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-ink">
            建议操作
            <select className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" value={requestedAction} onChange={(event) => setRequestedAction(event.target.value)} required>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm font-medium text-ink">
            建议理由
            <textarea className="mt-2 min-h-24 w-full border border-line bg-paper px-3 py-2 text-sm" maxLength={800} value={reason} onChange={(event) => setReason(event.target.value)} required />
          </label>
          <input className="hidden" tabIndex={-1} autoComplete="off" name="website" />
          <button disabled={busy} className="focus-ring mt-3 border border-blue bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" type="submit">
            提交建议
          </button>
          {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
