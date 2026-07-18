import { after, NextResponse } from "next/server";
import { del, get, head } from "@vercel/blob";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { hasTeaserExtractor, processTeaserDocument } from "@/lib/teasers/extraction";
import { ingestStoredTeaserFile, MAX_TEASER_FILE_SIZE } from "@/lib/teasers/ingest";

const PENDING_PATH = /^teasers\/pending\/[0-9a-f-]{36}\/[a-zA-Z0-9._\-\u4e00-\u9fff]{1,140}$/;

export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null);
  const pathname = typeof body?.pathname === "string" ? body.pathname : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "application/octet-stream";
  if (!PENDING_PATH.test(pathname) || !fileName) {
    return NextResponse.json({ error: "invalid_upload_registration" }, { status: 400 });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const metadata = await head(pathname, { token });
    if (!metadata.size || metadata.size > MAX_TEASER_FILE_SIZE) throw new Error("file_too_large");
    const blob = await get(pathname, { access: "private", token });
    if (!blob || blob.statusCode !== 200 || !blob.stream) throw new Error("uploaded_file_unavailable");
    const bytes = Buffer.from(await new Response(blob.stream).arrayBuffer());
    const result = await ingestStoredTeaserFile({
      bytes,
      fileName,
      mimeType: metadata.contentType || mimeType,
      sourceType: "web_upload",
      sourceLabel: "网站上传",
      stored: { provider: "vercel_blob", key: metadata.pathname, url: metadata.url }
    });

    if (result.duplicate && result.document.storageKey !== metadata.pathname) {
      await del(metadata.pathname, { token }).catch(() => undefined);
    }
    if (!result.duplicate && hasTeaserExtractor()) after(() => processTeaserDocument(result.document.id));
    return NextResponse.json({
      ok: true,
      id: result.document.id,
      fileName: result.document.fileName,
      status: result.document.status,
      duplicate: result.duplicate
    }, { status: 202 });
  } catch (error) {
    await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "upload_registration_failed" }, { status: 400 });
  }
}
