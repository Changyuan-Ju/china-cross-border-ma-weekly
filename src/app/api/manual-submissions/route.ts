import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanText, isRateLimited, optionalUrl, requestIp, stableHash } from "@/lib/public-input";

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (isRateLimited(`submission:${ip}`, 4)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body || cleanText(body.website, 80)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const title = cleanText(body.title, 180);
  const rawUrl = cleanText(body.sourceUrl, 500);
  const sourceUrl = rawUrl ? optionalUrl(rawUrl) : undefined;
  if (!title || title.length < 4) return NextResponse.json({ error: "title_required" }, { status: 400 });
  if (rawUrl && !sourceUrl) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const submissionHash = stableHash([title, sourceUrl]);
  const item = await prisma.manualSubmission.upsert({
    where: { submissionHash },
    update: {},
    create: { id: randomUUID(), title, sourceUrl, status: "review_required", submissionHash },
    select: { id: true, status: true }
  });

  return NextResponse.json({ ok: true, id: item.id, status: item.status });
}
