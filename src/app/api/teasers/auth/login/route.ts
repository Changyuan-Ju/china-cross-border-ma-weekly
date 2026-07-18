import { NextResponse } from "next/server";
import { cleanText, isRateLimited, requestIp } from "@/lib/public-input";
import {
  createTeaserSessionToken,
  teaserAuthIsConfigured,
  teaserSessionCookieOptions,
  TEASER_SESSION_COOKIE,
  verifyTeaserCredentials
} from "@/lib/teasers/auth";

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (isRateLimited(`teaser-login:${ip}`, 8)) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  if (!teaserAuthIsConfigured()) return NextResponse.json({ error: "authentication_not_configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const username = cleanText(body?.username, 80);
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  if (!verifyTeaserCredentials(username, password)) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TEASER_SESSION_COOKIE, createTeaserSessionToken(), teaserSessionCookieOptions());
  return response;
}
