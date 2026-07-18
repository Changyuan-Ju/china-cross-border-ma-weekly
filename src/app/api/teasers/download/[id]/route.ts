import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { readTeaserFile } from "@/lib/teasers/storage";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const document = await prisma.teaserDocument.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const bytes = await readTeaserFile(document.storageProvider, document.storageKey);
  return new NextResponse(bytes, {
    headers: {
      "content-type": document.mimeType,
      "content-length": String(bytes.length),
      "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "cache-control": "private, no-store"
    }
  });
}
