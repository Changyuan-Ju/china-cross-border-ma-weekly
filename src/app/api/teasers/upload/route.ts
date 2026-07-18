import { after, NextResponse } from "next/server";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { hasTeaserExtractor, processTeaserDocument } from "@/lib/teasers/extraction";
import { ingestTeaserFile, MAX_TEASER_BATCH_SIZE } from "@/lib/teasers/ingest";

export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  if (!files.length) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (files.length > MAX_TEASER_BATCH_SIZE) return NextResponse.json({ error: "too_many_files", maximum: MAX_TEASER_BATCH_SIZE }, { status: 400 });

  const items = [];
  for (const file of files) {
    try {
      const result = await ingestTeaserFile({
        bytes: Buffer.from(await file.arrayBuffer()),
        fileName: file.name,
        mimeType: file.type,
        sourceType: "web_upload",
        sourceLabel: "网站上传"
      });
      items.push({ id: result.document.id, fileName: result.document.fileName, status: result.document.status, duplicate: result.duplicate });
      if (!result.duplicate && hasTeaserExtractor()) after(() => processTeaserDocument(result.document.id));
    } catch (error) {
      items.push({ fileName: file.name, error: error instanceof Error ? error.message : "upload_failed" });
    }
  }
  return NextResponse.json({ ok: true, items }, { status: 202 });
}
