const fs = require("node:fs");
const path = require("node:path");
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

function isInvalidPublicSource(url) {
  return !url || /fulltextSearch|search|query/i.test(url);
}

async function main() {
  const rows = await prisma.dealSource.findMany();
  let repaired = 0;
  let unavailable = 0;
  for (const row of rows) {
    if (isInvalidPublicSource(row.url)) {
      await prisma.dealSource.update({
        where: { id: row.id },
        data: {
          linkStatus: "not_publicly_available",
          sourceType: "wind_record",
          isPrimary: true,
          lastVerifiedAt: new Date(),
          publisher: row.publisher || "Wind公告库",
          url: ""
        }
      });
      repaired += 1;
      unavailable += 1;
    } else {
      await prisma.dealSource.update({
        where: { id: row.id },
        data: {
          linkStatus: row.linkStatus || "valid",
          lastVerifiedAt: new Date(),
          isPrimary: row.isPrimary || row.id === rows[0]?.id
        }
      });
    }
  }
  console.log(JSON.stringify({ ok: true, repaired, notPubliclyAvailable: unavailable }));
}

main().finally(() => prisma.$disconnect()).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
