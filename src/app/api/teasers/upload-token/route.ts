import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { MAX_TEASER_FILE_SIZE } from "@/lib/teasers/ingest";

const PENDING_PATH = /^teasers\/pending\/[0-9a-f-]{36}\/[a-zA-Z0-9._\-\u4e00-\u9fff]{1,140}$/;

export async function GET(request: Request) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  return NextResponse.json({ directUpload: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}

export async function POST(request: Request) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "direct_upload_unavailable" }, { status: 501 });
  }

  const body = await request.json().catch(() => null) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "invalid_upload_request" }, { status: 400 });

  try {
    const result = await handleUpload({
      request,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        if (!PENDING_PATH.test(pathname)) throw new Error("invalid_upload_path");
        return {
          maximumSizeInBytes: MAX_TEASER_FILE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000
        };
      }
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "upload_token_failed" }, { status: 400 });
  }
}
