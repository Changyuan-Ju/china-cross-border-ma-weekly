import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "中资企业跨境并购周报",
  description: "中资企业跨境并购交易数据库及周报网站"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a href="#main-content" className="focus-ring sr-only absolute left-4 top-4 z-50 border border-ink bg-surface px-3 py-2 text-sm font-semibold text-ink focus:not-sr-only">
          跳至正文
        </a>
        <header className="relative z-30 border-b border-line bg-surface md:sticky md:top-0">
          <div className="shell flex min-h-16 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="group inline-flex flex-col">
              <div className="text-[11px] font-bold tracking-[0.22em] text-logo">CROSS-BORDER M&amp;A</div>
              <div className="mt-0.5 text-xl font-semibold tracking-normal text-ink">中资企业跨境并购周报</div>
              <div className="mt-0.5 text-[11px] tracking-[0.08em] text-subtle">华泰联合证券国际业务部出品</div>
            </Link>
            <SiteNav />
          </div>
        </header>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
