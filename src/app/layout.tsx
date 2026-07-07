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
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <div className="shell flex min-h-16 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="group inline-flex flex-col">
              <div className="text-[11px] font-bold tracking-[0.22em] text-logo">CROSS-BORDER M&amp;A</div>
              <div className="mt-0.5 text-xl font-semibold tracking-normal text-ink">中资企业跨境并购周报</div>
            </Link>
            <SiteNav />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
