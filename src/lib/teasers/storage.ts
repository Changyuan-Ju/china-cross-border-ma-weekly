import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { get, put } from "@vercel/blob";

export type StoredTeaserFile = {
  provider: "vercel_blob" | "local";
  key: string;
  url: string | null;
};

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "-").replace(/-+/g, "-").slice(-140) || "teaser-file";
}
export async function storeTeaserFile(id: string, fileName: string, mimeType: string, bytes: Buffer): Promise<StoredTeaserFile> {
  const key = `teasers/${id}/${safeFileName(fileName)}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await put(key, bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return { provider: "vercel_blob", key: result.pathname, url: result.url };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for production teaser uploads");
  }

  const absolutePath = path.join(process.cwd(), "data", key);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);
  return { provider: "local", key, url: null };
}

export async function readTeaserFile(provider: string, key: string) {
  if (provider === "vercel_blob") {
    const result = await get(key, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    if (!result || result.statusCode !== 200 || !result.stream) throw new Error("Stored teaser file is unavailable");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  const absolutePath = path.resolve(process.cwd(), "data", key);
  const allowedRoot = path.resolve(process.cwd(), "data", "teasers");
  if (!absolutePath.startsWith(allowedRoot + path.sep)) throw new Error("Invalid teaser storage path");
  return readFile(absolutePath);
}
