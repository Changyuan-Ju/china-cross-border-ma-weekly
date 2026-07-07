import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db";
import { upsertWeeklyPayloadToDatabase } from "@/lib/db-ingest";
import { weeklyPayloadSchema } from "@/lib/schema";
import { upsertWeeklyPayload } from "@/lib/store";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = process.env.INGEST_API_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = weeklyPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = hasDatabaseUrl() ? await upsertWeeklyPayloadToDatabase(parsed.data) : await upsertWeeklyPayload(parsed.data);
  return NextResponse.json({ ok: true, ...result });
}
