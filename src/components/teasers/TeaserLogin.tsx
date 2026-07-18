"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileSearch, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

export function TeaserLogin({ configured, defaultUsername }: { configured: boolean; defaultUsername: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/teasers/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) { router.refresh(); return; }
      const body = await response.json().catch(() => ({}));
      if (response.status === 429) setError("登录尝试次数过多，请稍后再试。");
      else if (body.error === "authentication_not_configured") setError("登录服务尚未完成配置，请联系管理员。");
      else setError("账号或密码不正确。");
    } catch {
      setError("暂时无法连接登录服务，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-[calc(100vh-97px)] border-b border-line bg-paper py-8 md:py-14">
    <div className="shell">
      <div className="mx-auto grid min-h-[590px] max-w-5xl overflow-hidden border border-line bg-surface shadow-[0_28px_80px_rgba(64,64,64,0.09)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative flex flex-col justify-between overflow-hidden border-b border-line bg-blue px-8 py-10 text-white lg:border-b-0 lg:border-r lg:px-11 lg:py-12">
          <div className="absolute inset-y-0 right-0 w-1 bg-gold" aria-hidden="true" />
          <div>
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#F1F1F1]"><Sparkles size={13} className="text-gold" />专项资料库</div>
            <h1 className="mt-8 max-w-md text-3xl font-semibold leading-tight md:text-4xl">Teaser 项目资料智库</h1>
            <p className="mt-5 max-w-xl text-pretty text-sm leading-7 text-[#F1F1F1]">将非标准化项目资料沉淀为可检索、可比较、<br className="hidden sm:block" />可追溯的项目档案与数据洞察。</p>
          </div>
          <div className="mt-12 grid gap-5 text-sm text-[#F1F1F1] sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-start gap-3 border-t border-white/25 pt-4"><ShieldCheck className="mt-0.5 shrink-0 text-gold" size={18} /><div><div className="font-semibold text-white">受保护的内部空间</div><div className="mt-1 text-xs leading-5 text-[#D9D9D9]">私有文件存储、授权访问与完整处理记录。</div></div></div>
            <div className="flex items-start gap-3 border-t border-white/25 pt-4"><FileSearch className="mt-0.5 shrink-0 text-gold" size={18} /><div><div className="font-semibold text-white">结构化项目画像</div><div className="mt-1 text-xs leading-5 text-[#D9D9D9]">识别项目代号、行业、区域、财务与顾问信息。</div></div></div>
          </div>
        </section>

        <section className="flex items-center px-8 py-10 md:px-12">
          <div className="w-full">
            <div className="inline-flex h-11 w-11 items-center justify-center border border-line bg-paper text-blue"><LockKeyhole size={20} /></div>
            <h2 className="mt-6 text-2xl font-semibold text-ink">进入项目资料智库</h2>
            <p className="mt-2 text-sm leading-6 text-muted">仅限授权用户访问，登录状态将在到期后自动失效。</p>
            <form className="mt-8" onSubmit={submit}>
              <label className="block text-sm font-medium text-ink" htmlFor="teaser-username">账号</label>
              <input id="teaser-username" autoComplete="username" className="focus-ring mt-2 w-full border border-line bg-paper px-3.5 py-3 text-sm text-ink hover:border-gold" value={username} onChange={(event) => setUsername(event.target.value)} />
              <label className="mt-5 block text-sm font-medium text-ink" htmlFor="teaser-password">密码</label>
              <div className="mt-2 flex border border-line bg-paper focus-within:border-gold"><input id="teaser-password" autoComplete="current-password" type={showPassword ? "text" : "password"} className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-ink outline-none" value={password} onChange={(event) => setPassword(event.target.value)} required /><button className="focus-ring px-3 text-muted hover:text-blue" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              <div aria-live="polite">{error ? <p className="mt-4 border-l-2 border-oxblood pl-3 text-sm leading-6 text-oxblood">{error}</p> : null}{!configured ? <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">登录服务尚未完成配置。</p> : null}</div>
              <button disabled={busy} className="focus-ring mt-7 w-full border border-blue bg-blue px-4 py-3 text-sm font-semibold text-white hover:border-blue2 hover:bg-blue2 disabled:cursor-wait disabled:opacity-60" type="submit">{busy ? "正在验证…" : "进入资料智库"}</button>
            </form>
            <p className="mt-7 border-t border-line pt-5 text-xs leading-5 text-subtle">资料仅限内部工作使用，请妥善管理访问权限。</p>
          </div>
        </section>
      </div>
    </div>
  </div>;
}
