import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    moderationRequest: { upsert }
  }
}));

describe("moderation request API", () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockResolvedValue({ id: "request-1", status: "pending" });
  });

  it("creates a pending suggestion without changing the target", async () => {
    const { POST } = await import("../route");
    const response = await POST(request({ targetType: "deal", targetId: "deal-1", requestedAction: "exclude", reason: "公告不符合筛选标准", website: "" }));
    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body.status).toBe("pending");
  });

  it("rejects honeypot submissions", async () => {
    const { POST } = await import("../route");
    const response = await POST(request({ targetType: "deal", targetId: "deal-1", requestedAction: "exclude", reason: "test", website: "bot" }));
    expect(response.status).toBe(400);
  });
});

function request(body: unknown) {
  return new Request("http://localhost/api/moderation-requests", { method: "POST", body: JSON.stringify(body) });
}
