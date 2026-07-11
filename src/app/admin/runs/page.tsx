import { readRuns } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await readRuns();
  return (
    <div className="shell py-8">
      <div className="text-xs font-bold tracking-[0.18em] text-gold">INGESTION RUNS</div>
      <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">运行记录</h1>
      <p className="mt-3 text-sm leading-7 text-muted">展示周报采集与入库任务的公开运行摘要，不包含密钥、连接字符串或内部配置。</p>
      <div className="mt-6 overflow-x-auto border border-line bg-surface">
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
            {runs.map((run) => (
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
        {!runs.length ? <div className="p-6 text-sm text-muted">暂无运行记录。</div> : null}
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
