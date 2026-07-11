const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");

loadEnvFile(".env");

const prisma = new PrismaClient();
const tables = ["Deal", "DealEvent", "DealSource", "WeeklyIssue", "IngestionRun", "ExcludedCandidate", "ReviewItem", "ManualSubmission"];

async function main() {
  const findings = [];
  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, to_jsonb(t)::text AS data FROM "${table}" t WHERE to_jsonb(t)::text LIKE $1 ORDER BY id`,
      "%�%"
    );
    for (const row of rows) findings.push({ table, id: row.id, excerpts: excerpts(row.data) });
  }

  console.log(JSON.stringify({ mode: "scan", affectedRows: findings.length, findings }, null, 2));
  if (!process.argv.includes("--apply")) return;

  const result = await prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({ where: { id: "deal-jiahe-beyerdynamic-20260706" } });
    if (!deal) throw new Error("beyerdynamic deal not found");
    const sellerNames = deal.sellerNames.map((name) => name.replaceAll("M�hling", "Mühling"));
    const changedSellerNames = sellerNames.filter((name, index) => name !== deal.sellerNames[index]).length;
    if (changedSellerNames) await tx.deal.update({ where: { id: deal.id }, data: { sellerNames } });

    const sourcePublisherUpdate = await tx.dealSource.updateMany({
      where: { publisher: "Wind公告库，公开链接未取得" },
      data: { publisher: "Wind公告库" }
    });

    const runs = await tx.ingestionRun.findMany();
    let changedPayloads = 0;
    for (const run of runs) {
      const nextPayload = replaceKnownCorruption(run.payload);
      const nextExcludedItems = replaceKnownCorruption(run.excludedItems);
      if (JSON.stringify(nextPayload) !== JSON.stringify(run.payload) || JSON.stringify(nextExcludedItems) !== JSON.stringify(run.excludedItems)) {
        await tx.ingestionRun.update({ where: { id: run.id }, data: { payload: nextPayload, excludedItems: nextExcludedItems } });
        changedPayloads += 1;
      }
    }

    return { changedSellerNames, changedPayloads, changedSourcePublishers: sourcePublisherUpdate.count };
  });

  console.log(JSON.stringify({ mode: "apply", ...result }, null, 2));
}

function replaceKnownCorruption(value) {
  if (typeof value === "string") {
    return value
      .replaceAll("M�hling", "Mühling")
      .replaceAll("Wind公告库，公开链接未取得", "Wind公告库");
  }
  if (Array.isArray(value)) return value.map(replaceKnownCorruption);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceKnownCorruption(item)]));
  }
  return value;
}

function excerpts(value) {
  const text = String(value);
  const matches = [];
  let index = text.indexOf("�");
  while (index >= 0 && matches.length < 10) {
    matches.push(text.slice(Math.max(0, index - 40), Math.min(text.length, index + 41)));
    index = text.indexOf("�", index + 1);
  }
  return matches;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Text corruption repair failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
