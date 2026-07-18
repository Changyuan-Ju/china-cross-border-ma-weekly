import { NextResponse } from "next/server";
import { teaserSessionCookieOptions, TEASER_SESSION_COOKIE } from "@/lib/teasers/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TEASER_SESSION_COOKIE, "", { ...teaserSessionCookieOptions(), maxAge: 0 });
  return response;
}
