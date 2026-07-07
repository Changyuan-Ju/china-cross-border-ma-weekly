import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "中资企业跨境并购周报",
  description: "中资企业跨境并购交易数据库及周报网站"
};

const navItems = [
  ["首页", "/"],
  ["交易数据库", "/deals"],
  ["历史周报", "/archive"],
  ["补充交易", "/submit"],
  ["方法说明", "/methodology"],
  ["运行记录", "/admin/runs"]
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between">
            <Link href="/" className="group">
              <div className="text-xs font-bold tracking-[0.18em] text-logo">CROSS-BORDER M&A</div>
              <div className="mt-1 text-2xl font-semibold text-ink">中资企业跨境并购周报</div>
            </Link>
            <nav className="flex flex-wrap gap-2">
              {navItems.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="focus-ring border border-line bg-paper px-3 py-2 text-sm text-ink hover:border-blue hover:text-blue active:border-gold"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
