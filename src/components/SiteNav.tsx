"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Sparkles } from "lucide-react";

const weeklyNavItems = [
  ["首页", "/"],
  ["交易数据库", "/deals"],
  ["历史周报", "/archive"],
  ["补充交易", "/submit"],
  ["方法说明", "/methodology"],
  ["运行记录", "/admin/runs"]
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="主导航" className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
      {weeklyNavItems.map(([label, href]) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "focus-ring border-b-2 px-0.5 py-1 text-sm font-medium text-muted hover:border-gold hover:text-ink",
              active ? "border-gold text-ink" : "border-transparent"
            )}
          >
            {label}
          </Link>
        );
      })}
      <Link
        href="/teasers"
        className={clsx(
          "focus-ring ml-auto inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold md:ml-3",
          pathname.startsWith("/teasers")
            ? "border-blue bg-blue text-white"
            : "border-blue/40 bg-[#0C4E98]/5 text-blue hover:border-blue hover:bg-[#0C4E98]/10"
        )}
      >
        <Sparkles size={14} />
        <span>项目资料智库</span>
        <span className={clsx("border-l pl-2 text-[9px] tracking-[0.12em]", pathname.startsWith("/teasers") ? "border-white/35 text-white/80" : "border-blue/25 text-gold")}>专项资料库</span>
      </Link>
    </nav>
  );
}
