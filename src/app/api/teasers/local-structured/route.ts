import { NextResponse } from "next/server";
import { hasValidSyncToken } from "@/lib/teasers/api-auth";
import { applyTeaserExtraction, teaserExtractionValidator } from "@/lib/teasers/extraction";
import { ingestTeaserFile } from "@/lib/teasers/ingest";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!hasValidSyncToken(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const metadataText = formData?.get("metadata");
  if (!(file instanceof File) || typeof metadataText !== "string") return NextResponse.json({ error: "file_and_metadata_required" }, { status: 400 });

  const metadata = (() => { try { return JSON.parse(metadataText); } catch { return null; } })();
  const parsed = teaserExtractionValidator.safeParse(metadata);
  if (!parsed.success) return NextResponse.json({ error: "invalid_structured_metadata", details: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await ingestTeaserFile({
      bytes: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sourceType: "local_folder",
      sourceLabel: "Codex本地结构化处理"
    });
    await applyTeaserExtraction(result.document.id, parsed.data);
    return NextResponse.json({ ok: true, id: result.document.id, duplicate: result.duplicate, status: "completed" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "local_structured_ingest_failed" }, { status: 400 });
  }
}
