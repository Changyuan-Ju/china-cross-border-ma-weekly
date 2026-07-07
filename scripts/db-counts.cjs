const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");

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

loadEnvFile(".env");

const prisma = new PrismaClient();
const tables = ["Deal", "DealEvent", "DealSource", "WeeklyIssue", "IngestionRun", "ExcludedCandidate", "ReviewItem"];

async function main() {
  const existing = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  const existingNames = new Set(existing.map((row) => row.table_name));
  for (const table of tables) {
    const exists = existingNames.has(table);
    let count = "NA";
    if (exists) {
      const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
      count = rows[0].count;
    }
    console.log(`${table}: exists=${exists ? "yes" : "no"} count=${count}`);
  }
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await prisma.$disconnect();
  process.exit(1);
});
