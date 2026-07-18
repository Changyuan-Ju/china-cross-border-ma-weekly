import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasTeaserExtractor } from "./extraction";
import { storeTeaserFile } from "./storage";

export const MAX_TEASER_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_TEASER_BATCH_SIZE = 5;
const ALLOWED_EXTENSIONS = new Set(["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "csv", "txt", "png", "jpg", "jpeg"]);

export type TeaserIngestInput = {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
  sourceType: "web_upload" | "local_folder" | "public_url" | "email" | "cloud_drive";
  sourceLabel?: string;
  originalUrl?: string;
};

type StoredTeaserIngestInput = TeaserIngestInput & {
  stored: {
    provider: "vercel_blob" | "local";
    key: string;
    url: string | null;
  };
};

function cleanFileName(fileName: string) {
  return fileName.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 240);
}

function extensionOf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function validateTeaserFile(fileName: string, bytes: Buffer) {
  if (!fileName || !ALLOWED_EXTENSIONS.has(extensionOf(fileName))) throw new Error("unsupported_file_type");
  if (!bytes.length) throw new Error("empty_file");
  if (bytes.length > MAX_TEASER_FILE_SIZE) throw new Error("file_too_large");
}

export async function ingestTeaserFile(input: TeaserIngestInput) {
  const fileName = cleanFileName(input.fileName);
  validateTeaserFile(fileName, input.bytes);
  const duplicate = await findDuplicate(input.bytes);
  if (duplicate) return { document: duplicate, duplicate: true };
  const id = crypto.randomUUID();
  const stored = await storeTeaserFile(id, fileName, input.mimeType || "application/octet-stream", input.bytes);
  return ingestStoredTeaserFile({ ...input, fileName, stored });
}

export async function ingestStoredTeaserFile(input: StoredTeaserIngestInput) {
  const fileName = cleanFileName(input.fileName);
  validateTeaserFile(fileName, input.bytes);
  const fingerprint = crypto.createHash("sha256").update(input.bytes).digest("hex");
  const duplicate = await findDuplicate(input.bytes);
  if (duplicate) return { document: duplicate, duplicate: true };

  const id = crypto.randomUUID();
  let document;
  try {
    document = await prisma.$transaction(async (tx) => {
      const created = await tx.teaserDocument.create({
        data: {
          id,
          fingerprint,
          fileName,
          mimeType: input.mimeType || "application/octet-stream",
          fileSize: input.bytes.length,
          storageProvider: input.stored.provider,
          storageKey: input.stored.key,
          storageUrl: input.stored.url,
          sourceType: input.sourceType,
          sourceLabel: input.sourceLabel,
          originalUrl: input.originalUrl,
          status: hasTeaserExtractor() ? "queued" : "configuration_required"
        },
        select: { id: true, status: true, opportunityId: true, fileName: true, storageKey: true }
      });
      await tx.teaserSourceConnection.upsert({
        where: { type_name: { type: input.sourceType, name: input.sourceLabel || sourceName(input.sourceType) } },
        update: { status: "active", lastSyncAt: new Date(), itemCount: { increment: 1 } },
        create: {
          type: input.sourceType,
          name: input.sourceLabel || sourceName(input.sourceType),
          status: "active",
          lastSyncAt: new Date(),
          itemCount: 1,
          localPath: input.sourceType === "local_folder" ? input.sourceLabel : null
        }
      });
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const racedDuplicate = await findDuplicate(input.bytes);
      if (racedDuplicate) return { document: racedDuplicate, duplicate: true };
    }
    throw error;
  }

  return { document, duplicate: false };
}

async function findDuplicate(bytes: Buffer) {
  const fingerprint = crypto.createHash("sha256").update(bytes).digest("hex");
  return prisma.teaserDocument.findUnique({
    where: { fingerprint },
    select: { id: true, status: true, opportunityId: true, fileName: true, storageKey: true }
  });
}

function sourceName(sourceType: TeaserIngestInput["sourceType"]) {
  const names = {
    web_upload: "网站上传",
    local_folder: "本地文件夹同步",
    public_url: "公开链接导入",
    email: "邮件转入",
    cloud_drive: "云盘连接"
  };
  return names[sourceType];
}
