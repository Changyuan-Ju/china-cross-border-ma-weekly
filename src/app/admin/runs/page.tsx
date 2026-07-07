import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const store = await readStore();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-ink">后台运行记录</h1>
      <p className="mt-2 text-sm text-muted">生产环境应在边缘网关或中间件层用 ADMIN_SECRET 保护本页面。</p>
      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-paper text-ink">
            <tr>
              <Th>运行时间</Th>
              <Th>范围</Th>
              <Th>候选</Th>
              <Th>纳入</Th>
              <Th>排除</Th>
              <Th>复核</Th>
              <Th>状态</Th>
              <Th>错误</Th>
            </tr>
          </thead>
          <tbody>
            {store.runs.map((run) => (
              <tr key={run.id} className="border-t border-line">
                <Td>{run.run_started_at}</Td>
                <Td>{run.issue_start_date} 至 {run.issue_end_date}</Td>
                <Td>{run.candidate_count}</Td>
                <Td>{run.included_count}</Td>
                <Td>{run.excluded_count}</Td>
                <Td>{run.review_required_count}</Td>
                <Td>{run.status}</Td>
                <Td>{run.errors.join("；") || "无"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {!store.runs.length ? <div className="p-6 text-sm text-muted">暂无运行记录。</div> : null}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-line px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-muted">{children}</td>;
}
