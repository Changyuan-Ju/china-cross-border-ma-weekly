import { NextResponse } from "next/server";
import { getTeaserSessionFromRequest } from "./auth";

export function requireTeaserApiSession(request: Request) {
  const session = getTeaserSessionFromRequest(request);
  if (!session) return { session: null, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { session, response: null };
}

export function hasValidSyncToken(request: Request) {
  const expected = process.env.TEASER_SYNC_TOKEN || process.env.INGEST_API_TOKEN;
  return Boolean(expected && request.headers.get("authorization") === `Bearer ${expected}`);
}
