import Link from "next/link";
import { fmtIssueRange } from "@/lib/format";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const store = await readStore();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-ink">历史周报</h1>
      <div className="mt-6 grid gap-3">
        {store.issues.length ? (
          store.issues.map((issue) => (
            <Link key={issue.id} href={`/weekly/${issue.id}`} className="focus-ring border border-line bg-white p-5 hover:border-blue">
              <div className="text-lg font-semibold text-ink">{fmtIssueRange(issue.start_date, issue.end_date)}</div>
              <div className="mt-2 text-sm text-muted">
                纳入 {issue.included_count} 笔，排除 {issue.excluded_count} 笔，复核 {issue.review_required_count} 笔
              </div>
            </Link>
          ))
        ) : (
          <div className="border border-line bg-white p-6 text-sm text-muted">暂无历史周报。</div>
        )}
      </div>
    </div>
  );
}
