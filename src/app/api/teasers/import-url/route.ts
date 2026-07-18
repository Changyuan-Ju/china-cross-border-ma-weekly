import { isIP } from "node:net";
import { after, NextResponse } from "next/server";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { hasTeaserExtractor, processTeaserDocument } from "@/lib/teasers/extraction";
import { ingestTeaserFile } from "@/lib/teasers/ingest";

export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null);
  const parsed = parsePublicUrl(body?.url);
  if (!parsed) return NextResponse.json({ error: "invalid_public_url" }, { status: 400 });

  try {
    const response = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return NextResponse.json({ error: "remote_file_unavailable", status: response.status }, { status: 400 });
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > 25 * 1024 * 1024) return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    const bytes = Buffer.from(await response.arrayBuffer());
    const fileName = remoteFileName(response, parsed);
    const result = await ingestTeaserFile({
      bytes,
      fileName,
      mimeType: response.headers.get("content-type")?.split(";")[0] || "application/octet-stream",
      sourceType: "public_url",
      sourceLabel: parsed.hostname,
      originalUrl: parsed.toString()
    });
    if (!result.duplicate && hasTeaserExtractor()) after(() => processTeaserDocument(result.document.id));
    return NextResponse.json({ ok: true, id: result.document.id, duplicate: result.duplicate, status: result.document.status }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "url_import_failed" }, { status: 400 });
  }
}

function parsePublicUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 1200) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (isPrivateAddress(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateAddress(host: string) {
  if (!isIP(host)) return false;
  return /^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "::1";
}

function remoteFileName(response: Response, url: URL) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1].replace(/"/g, "")).slice(0, 240);
  const fromPath = decodeURIComponent(url.pathname.split("/").pop() || "online-teaser.pdf");
  return fromPath.includes(".") ? fromPath : `${fromPath}.pdf`;
}
