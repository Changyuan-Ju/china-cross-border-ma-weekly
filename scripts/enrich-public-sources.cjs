const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

loadEnv();
const prisma = new PrismaClient();

function loadEnv() {
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isSearchUrl(url) {
  return /(?:google\.|baidu\.|bing\.|fulltextSearch|\/search(?:[/?#]|$)|[?&](?:q|query|keyword)=)/i.test(url);
}

function validateMapping(item) {
  if (!item.sourceId || !item.url || !item.title || !item.publisher || !item.sourceType) throw new Error("mapping_requires_sourceId_url_title_publisher_sourceType");
  const url = new URL(item.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`unsupported_url:${item.url}`);
  if (isSearchUrl(item.url)) throw new Error(`search_result_url_not_allowed:${item.url}`);
}

function readMappings() {
  const mappingFile = arg("--mapping");
  if (!mappingFile) throw new Error("--mapping is required");
  const mappings = JSON.parse(fs.readFileSync(path.resolve(mappingFile), "utf8"));
  if (!Array.isArray(mappings)) throw new Error("mapping_file_must_be_an_array");
  mappings.forEach(validateMapping);
  const ids = new Set();
  for (const mapping of mappings) {
    if (ids.has(mapping.sourceId)) throw new Error(`duplicate_source_id:${mapping.sourceId}`);
    ids.add(mapping.sourceId);
  }
  return mappings;
}

function sourceFingerprint(url, title, publishedAt) {
  return createHash("sha256").update([url || "", title || "", publishedAt || ""].join("|")).digest("hex");
}

async function audit() {
  const rows = await prisma.dealSource.findMany({
    where: {
      OR: [
        { url: "" },
        { linkStatus: { in: ["not_publicly_available", "broken", "inaccessible"] } },
        { sourceType: "wind_record" }
      ]
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      deal: { select: { articleTitle: true, buyerNameCn: true, buyerTicker: true, latestAnnouncementDate: true } },
      event: { select: { title: true, announcementDate: true } }
    }
  });
  console.log(JSON.stringify(rows, (_key, value) => value instanceof Date ? value.toISOString() : value, 2));
}

async function applyMappings() {
  const mappings = readMappings();

  const results = [];
  for (const mapping of mappings) {
    const result = await prisma.$transaction(async (tx) => {
      const source = await tx.dealSource.findUnique({ where: { id: mapping.sourceId } });
      if (!source) throw new Error(`source_not_found:${mapping.sourceId}`);
      const verifiedAt = mapping.lastVerifiedAt ? new Date(mapping.lastVerifiedAt) : new Date();
      const publishedAt = mapping.publishedAt ? new Date(mapping.publishedAt) : source.publishedAt;

      if (mapping.isPrimary !== false) {
        await tx.dealSource.updateMany({
          where: { dealId: source.dealId, eventId: source.eventId, id: { not: source.id } },
          data: { isPrimary: false }
        });
      }

      const updated = await tx.dealSource.update({
        where: { id: source.id },
        data: {
          title: mapping.title,
          url: mapping.url,
          publisher: mapping.publisher,
          sourceType: mapping.sourceType,
          linkStatus: "valid",
          isPrimary: mapping.isPrimary !== false,
          lastVerifiedAt: verifiedAt,
          publishedAt
        }
      });

      if (source.eventId) {
        const event = await tx.dealEvent.findUnique({ where: { id: source.eventId } });
        if (event) {
          const current = Array.isArray(event.sourceData) ? event.sourceData : [];
          const nextItem = {
            title: mapping.title,
            url: mapping.url,
            publisher: mapping.publisher,
            source_type: mapping.sourceType,
            is_primary: mapping.isPrimary !== false,
            link_status: "valid",
            last_verified_at: verifiedAt.toISOString(),
            wind_record_id: source.windRecordId,
            published_at: publishedAt?.toISOString()
          };
          const filtered = current.filter((item) => item && item.url !== source.url && item.title !== source.title);
          await tx.dealEvent.update({ where: { id: event.id }, data: { sourceData: [nextItem, ...filtered] } });
        }
      }
      return { id: updated.id, dealId: updated.dealId, url: updated.url, sourceFingerprint: sourceFingerprint(updated.url, updated.title, updated.publishedAt?.toISOString()) };
    });
    results.push(result);
  }
  console.log(JSON.stringify({ ok: true, updated: results.length, results }, null, 2));
}

function validateMappings() {
  const mappings = readMappings();
  const byType = mappings.reduce((result, item) => {
    result[item.sourceType] = (result[item.sourceType] || 0) + 1;
    return result;
  }, {});
  console.log(JSON.stringify({ ok: true, mappings: mappings.length, byType }, null, 2));
}

async function main() {
  const command = process.argv[2] || "audit";
  if (command === "audit") return audit();
  if (command === "validate") return validateMappings();
  if (command === "apply") return applyMappings();
  throw new Error("Usage: enrich-public-sources.cjs audit | validate --mapping path/to/mapping.json | apply --mapping path/to/mapping.json");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
