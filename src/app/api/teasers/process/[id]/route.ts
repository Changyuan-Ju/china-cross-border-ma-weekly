import { NextResponse } from "next/server";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { hasTeaserExtractor, previewTeaserExtraction, processTeaserDocument, type TeaserExtractorProvider } from "@/lib/teasers/extraction";

export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  if (!hasTeaserExtractor()) return NextResponse.json({ error: "qwen_not_configured" }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const provider: TeaserExtractorProvider = ["qwen", "gemini"].includes(body?.provider) ? body.provider : "auto";
  if (body?.preview === true && provider !== "auto") {
    return NextResponse.json({ ok: true, provider, extraction: await previewTeaserExtraction(id, provider) });
  }
  await processTeaserDocument(id, { force: body?.force === true, provider });
  return NextResponse.json({ ok: true });
}
