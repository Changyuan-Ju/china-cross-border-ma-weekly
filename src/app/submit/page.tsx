"use client";

import { useState } from "react";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/manual-submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, sourceUrl, website: "" })
    });
    setBusy(false);
    if (response.ok) {
      setMessage("交易线索已提交，感谢补充。");
      setTitle("");
      setSourceUrl("");
    } else {
      setMessage("提交失败，请检查标题或链接格式。");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-ink">补充交易</h1>
      <p className="mt-3 text-sm leading-7 text-muted">提交内容将进入人工复核，不会直接纳入正式交易数据库。审核通过后，系统将进一步检索公告、补充信息并决定是否发布。</p>
      <form onSubmit={submit} className="mt-6 border border-line bg-white p-5">
        <label className="block text-sm font-medium text-ink">
          标题
          <input className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          公告链接
          <input className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" maxLength={500} value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="可选" />
        </label>
        <input className="hidden" tabIndex={-1} autoComplete="off" name="website" />
        <button disabled={busy} className="focus-ring mt-5 border border-blue bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" type="submit">
          提交交易线索
        </button>
        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      </form>
    </div>
  );
}
