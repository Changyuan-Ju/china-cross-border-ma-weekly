"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
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
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
      {navItems.map(([label, href]) => {
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
    </nav>
  );
}
