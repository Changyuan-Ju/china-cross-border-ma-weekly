import crypto from "node:crypto";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isRateLimited(key: string, limit = 6, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function stableHash(parts: Array<string | null | undefined>) {
  return crypto.createHash("sha256").update(parts.map((part) => (part ?? "").trim().toLowerCase()).join("|")).digest("hex");
}

export function optionalUrl(value: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}
