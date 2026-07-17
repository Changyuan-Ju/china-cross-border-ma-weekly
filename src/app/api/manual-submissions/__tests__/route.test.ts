import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    manualSubmission: { upsert }
  }
}));

describe("manual submission API", () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockResolvedValue({ id: "submission-1", status: "submitted" });
  });

  it("accepts a simple public deal lead", async () => {
    const { POST } = await import("../route");
    const response = await POST(request({ title: "某上市公司拟收购德国汽车零部件企业", sourceUrl: "https://example.com/announcement.pdf", website: "" }));
    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body.status).toBe("submitted");
  });

  it("rejects invalid urls", async () => {
    const { POST } = await import("../route");
    const response = await POST(request({ title: "某上市公司拟收购德国汽车零部件企业", sourceUrl: "javascript:alert(1)", website: "" }));
    expect(response.status).toBe(400);
  });
});

function request(body: unknown) {
  return new Request("http://localhost/api/manual-submissions", { method: "POST", body: JSON.stringify(body) });
}
