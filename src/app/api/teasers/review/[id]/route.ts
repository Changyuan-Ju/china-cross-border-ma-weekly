import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (body?.status !== "resolved" && body?.status !== "dismissed") return NextResponse.json({ error: "invalid_status" }, { status: 400 });

  const item = await prisma.teaserReviewItem.update({
    where: { id },
    data: { status: body.status, resolvedAt: new Date(), resolvedBy: auth.session?.username },
    select: { id: true, status: true }
  });
  return NextResponse.json({ ok: true, item });
}
