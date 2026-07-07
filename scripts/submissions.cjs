const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

loadEnv();
const prisma = new PrismaClient();
const command = process.argv[2];
const id = readArg("--id");

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

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function list() {
  const rows = await prisma.manualSubmission.findMany({ where: { status: { in: ["submitted", "review_required", "approved_pending_wind_enrichment"] } }, orderBy: { createdAt: "asc" }, take: 50 });
  console.table(rows.map((row) => ({ id: row.id, title: row.title, status: row.status, createdAt: row.createdAt.toISOString() })));
}

async function show() {
  if (!id) throw new Error("--id is required");
  const row = await prisma.manualSubmission.findUnique({ where: { id } });
  if (!row) throw new Error("submission_not_found");
  console.log(JSON.stringify({ ...row, createdAt: row.createdAt.toISOString(), reviewedAt: row.reviewedAt?.toISOString() }, null, 2));
}

async function approve() {
  if (!id) throw new Error("--id is required");
  const row = await prisma.manualSubmission.findUnique({ where: { id } });
  if (!row) throw new Error("submission_not_found");
  if (row.status === "approved_pending_wind_enrichment" || row.status === "approved") {
    console.log(JSON.stringify({ ok: true, status: row.status }));
    return;
  }
  await prisma.manualSubmission.update({
    where: { id },
    data: {
      status: "approved_pending_wind_enrichment",
      reviewedAt: new Date(),
      reviewNote: "已批准进入Wind核验及标准化入库流程；正式纳入前不得直接计入交易统计。"
    }
  });
  console.log(JSON.stringify({ ok: true, status: "approved_pending_wind_enrichment" }));
}

async function reject() {
  if (!id) throw new Error("--id is required");
  await prisma.manualSubmission.update({ where: { id }, data: { status: "rejected", reviewedAt: new Date(), reviewNote: "管理员拒绝人工补充线索" } });
  console.log(JSON.stringify({ ok: true, status: "rejected" }));
}

async function main() {
  if (command === "list") return list();
  if (command === "show") return show();
  if (command === "approve") return approve();
  if (command === "reject") return reject();
  throw new Error("Usage: node scripts/submissions.cjs list|show|approve|reject --id [submission-id]");
}

main().finally(() => prisma.$disconnect()).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
