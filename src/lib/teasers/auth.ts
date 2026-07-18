import crypto from "node:crypto";
import { cookies } from "next/headers";

export const TEASER_SESSION_COOKIE = "htlh_teaser_session";
export const DEFAULT_TEASER_USERNAME = "HTLH-IIB-Admin";
const SESSION_SECONDS = 8 * 60 * 60;

type SessionPayload = {
  username: string;
  expiresAt: number;
};

function configuredUsername() {
  return process.env.TEASER_ADMIN_USERNAME?.trim() || DEFAULT_TEASER_USERNAME;
}

function configuredPassword() {
  return process.env.TEASER_ADMIN_PASSWORD || "";
}

function signingSecret() {
  return process.env.TEASER_AUTH_SECRET || "";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string) {
  const secret = signingSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function teaserAuthIsConfigured() {
  return Boolean(configuredPassword() && signingSecret());
}

export function verifyTeaserCredentials(username: string, password: string) {
  if (!teaserAuthIsConfigured()) return false;
  return safeEqual(username, configuredUsername()) && safeEqual(password, configuredPassword());
}

export function createTeaserSessionToken() {
  const payload: SessionPayload = {
    username: configuredUsername(),
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyTeaserSessionToken(token: string | undefined | null) {
  if (!token || !teaserAuthIsConfigured()) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (payload.username !== configuredUsername() || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getTeaserSession() {
  const cookieStore = await cookies();
  return verifyTeaserSessionToken(cookieStore.get(TEASER_SESSION_COOKIE)?.value);
}

export function getTeaserSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === TEASER_SESSION_COOKIE)?.[1];
  return verifyTeaserSessionToken(token);
}

export function teaserSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_SECONDS
  };
}
