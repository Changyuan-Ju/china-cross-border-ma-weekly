import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testStore = path.resolve(process.cwd(), "data/test-store.json");

const payload = {
  issue_start_date: "2026-06-27",
  issue_end_date: "2026-07-03",
  run_started_at: "2026-07-03T14:00:00.000Z",
  run_completed_at: "2026-07-03T14:08:00.000Z",
  candidate_count: 1,
  included_count: 1,
  excluded_count: 0,
  review_required_count: 0,
  deals: [
    {
      canonical_deal_id: "deal-api-001",
      deal_fingerprint: "deal-api-001",
      buyer_name_cn: "Buyer",
      seller_names: [],
      target_name_cn: "Target",
      deal_direction: "Outbound",
      transaction_type: "Equity acquisition",
      payment_methods: ["Cash"],
      announcement_date: "2026-07-01",
      announcement_type: "initial",
      transaction_stage: "agreement_signed",
      current_status: "ongoing",
      approvals_required: [],
      closing_conditions: [],
      strategic_rationale: [],
      article_title: "Buyer acquires Target",
      article_body: "Body",
      information_gaps: [],
      visible_tags: ["Outbound"],
      importance_score: 60,
      importance_score_breakdown: {},
      sources: [{ title: "Announcement", url: "https://example.com/api-001" }],
      evidence: {},
      validation_status: "valid"
    }
  ],
  excluded_items: [],
  errors: []
};

describe("weekly ingest API", () => {
  beforeEach(async () => {
    process.env.INGEST_API_TOKEN = "test-token";
    process.env.LOCAL_DATA_PATH = "data/test-store.json";
    process.env.DATABASE_URL = "";
    await mkdir(path.dirname(testStore), { recursive: true });
    await rm(testStore, { force: true });
    vi.resetModules();
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/internal/weekly-ingest", { method: "POST", body: JSON.stringify(payload) }));
    expect(response.status).toBe(401);
  });

  it("rejects invalid payloads", async () => {
    const { POST } = await import("../route");
    const response = await POST(request({ bad: true }));
    expect(response.status).toBe(400);
  });

  it("accepts valid payloads idempotently", async () => {
    const { POST } = await import("../route");
    const first = await POST(request(payload));
    const second = await POST(request(payload));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});

function request(body: unknown) {
  return new Request("http://localhost/api/internal/weekly-ingest", {
    method: "POST",
    headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}
