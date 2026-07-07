import { loadWeeklyPayloadFromJson } from "../src/lib/adapters/local-json";
import { collectFromWind } from "../src/lib/adapters/wind";
import { upsertWeeklyPayload } from "../src/lib/store";
import type { WeeklyPayload } from "../src/lib/types";

type Args = { from?: string; to?: string; file?: string; push?: boolean; source?: "json" | "wind" };

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--from") parsed.from = args[++i];
    else if (args[i] === "--to") parsed.to = args[++i];
    else if (args[i] === "--file") parsed.file = args[++i];
    else if (args[i] === "--source") parsed.source = args[++i] as Args["source"];
    else if (args[i] === "--push") parsed.push = true;
  }
  return parsed;
}

function defaultRange() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - 6);
  return { from: fromDate.toISOString().slice(0, 10), to };
}

async function getPayload(args: Args): Promise<WeeklyPayload> {
  const range = { ...defaultRange(), ...args };
  if ((args.source ?? "json") === "wind") return collectFromWind({ from: range.from, to: range.to });
  const payload = await loadWeeklyPayloadFromJson(args.file ?? "data/sample-weekly-payload.json");
  return {
    ...payload,
    issue_start_date: args.from ?? payload.issue_start_date,
    issue_end_date: args.to ?? payload.issue_end_date,
    run_started_at: new Date().toISOString(),
    run_completed_at: new Date().toISOString()
  };
}

async function pushPayload(payload: WeeklyPayload) {
  const siteUrl = process.env.PUBLIC_SITE_URL;
  const token = process.env.INGEST_API_TOKEN;
  if (!siteUrl || !token) throw new Error("PUBLIC_SITE_URL and INGEST_API_TOKEN are required for --push");
  const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/internal/weekly-ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Ingest API failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function main() {
  const args = parseArgs();
  const payload = await getPayload(args);
  const result = args.push ? await pushPayload(payload) : await upsertWeeklyPayload(payload);
  console.log(JSON.stringify({ ok: true, source: args.source ?? "json", issue: `${payload.issue_start_date}-to-${payload.issue_end_date}`, result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
