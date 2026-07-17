import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanText, isRateLimited, requestIp, stableHash } from "@/lib/public-input";

const actions = new Set(["include", "exclude"]);
const targets = new Set(["deal", "excluded_candidate", "manual_submission"]);

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (isRateLimited(`moderation:${ip}`)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body || cleanText(body.website, 80)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const targetType = cleanText(body.targetType, 40);
  const targetId = cleanText(body.targetId, 160);
  const requestedAction = cleanText(body.requestedAction, 40);
  const reason = cleanText(body.reason, 800);
  if (!targets.has(targetType) || !targetId || !actions.has(requestedAction) || reason.length < 4) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const requestHash = stableHash([targetType, targetId, requestedAction, reason]);
  const data = {
    id: randomUUID(),
    targetType,
    targetId,
    requestedAction,
    reason,
    requestHash,
    dealId: targetType === "deal" ? targetId : undefined,
    reviewItemId: targetType === "review_item" ? targetId : undefined,
    excludedCandidateId: targetType === "excluded_candidate" ? targetId : undefined
  };
  const item = await prisma.moderationRequest.upsert({
    where: { requestHash },
    update: {},
    create: data,
    select: { id: true, status: true }
  });

  return NextResponse.json({ ok: true, id: item.id, status: item.status });
}
