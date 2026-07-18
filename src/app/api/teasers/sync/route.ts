import { after, NextResponse } from "next/server";
import { hasValidSyncToken } from "@/lib/teasers/api-auth";
import { hasTeaserExtractor, processTeaserDocument } from "@/lib/teasers/extraction";
import { ingestTeaserFile } from "@/lib/teasers/ingest";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!hasValidSyncToken(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  const sourcePath = typeof formData?.get("sourcePath") === "string" ? String(formData.get("sourcePath")).slice(0, 500) : "本地文件夹";

  try {
    const result = await ingestTeaserFile({
      bytes: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      sourceType: "local_folder",
      sourceLabel: sourcePath
    });
    if (!result.duplicate && hasTeaserExtractor()) after(() => processTeaserDocument(result.document.id));
    return NextResponse.json({ ok: true, id: result.document.id, duplicate: result.duplicate, status: result.document.status }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "sync_failed" }, { status: 400 });
  }
}
