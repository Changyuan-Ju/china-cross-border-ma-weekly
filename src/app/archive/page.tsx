import Link from "next/link";
import { fmtIssueRange } from "@/lib/format";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const store = await readStore();
  const grouped = store.issues.reduce<Record<string, typeof store.issues>>((acc, issue) => {
    const year = issue.start_date.slice(0, 4);
    acc[year] ??= [];
    acc[year].push(issue);
    return acc;
  }, {});
  return (
    <div className="shell py-8">
      <div className="text-xs font-bold tracking-[0.18em] text-gold">ARCHIVE</div>
      <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">历史周报</h1>
      <div className="mt-6 grid gap-8">
        {store.issues.length ? (
          Object.entries(grouped).map(([year, issues]) => (
            <section key={year}>
              <h2 className="tabular border-b border-line pb-2 text-xl font-semibold text-ink">{year}</h2>
              <div className="mt-3 grid gap-3">
                {issues.map((issue, index) => (
                  <Link key={issue.id} href={`/weekly/${issue.id}`} className="focus-ring grid gap-3 border border-line bg-surface p-5 hover:border-gold md:grid-cols-[1fr_220px_120px] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-semibold text-ink">{fmtIssueRange(issue.start_date, issue.end_date)}</div>
                        {index === 0 ? <span className="border border-gold px-2 py-0.5 text-xs font-semibold text-ink">最新</span> : null}
                      </div>
                      <div className="mt-2 text-sm text-muted">纳入 {issue.included_count} 笔，排除 {issue.excluded_count} 笔，复核 {issue.review_required_count} 笔</div>
                    </div>
                    <div className="text-sm text-muted">发布时间：{issue.published_at.slice(0, 10)}</div>
                    <div className="text-sm font-semibold text-ink md:text-right">查看周报</div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="border border-line bg-surface p-6 text-sm text-muted">暂无历史周报。</div>
        )}
      </div>
    </div>
  );
}
