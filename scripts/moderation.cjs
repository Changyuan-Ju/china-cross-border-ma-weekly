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

function mapAction(action) {
  if (action === "include") return "valid";
  if (action === "review_required") return "review_required";
  return "rejected";
}

async function logChange({ targetType, targetId, previousStatus, nextStatus, reason, requestId }) {
  await prisma.statusChangeLog.create({
    data: {
      id: cryptoId(),
      targetType,
      targetId,
      previousStatus,
      nextStatus,
      reason,
      moderationRequestId: requestId,
      dealId: targetType === "deal" ? targetId : undefined,
      reviewItemId: targetType === "review_item" ? targetId : undefined,
      excludedCandidateId: targetType === "excluded_candidate" ? targetId : undefined
    }
  });
}

function cryptoId() {
  return require("node:crypto").randomUUID();
}

async function list() {
  const rows = await prisma.moderationRequest.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: 50 });
  console.table(rows.map((row) => ({ id: row.id, targetType: row.targetType, targetId: row.targetId, action: row.requestedAction, createdAt: row.createdAt.toISOString() })));
}

async function show() {
  if (!id) throw new Error("--id is required");
  const row = await prisma.moderationRequest.findUnique({ where: { id } });
  if (!row) throw new Error("request_not_found");
  console.log(JSON.stringify({ ...row, createdAt: row.createdAt.toISOString(), reviewedAt: row.reviewedAt?.toISOString() }, null, 2));
}

async function reject() {
  if (!id) throw new Error("--id is required");
  await prisma.moderationRequest.update({ where: { id }, data: { status: "rejected", reviewedAt: new Date(), resolutionNote: "管理员拒绝建议" } });
  console.log(JSON.stringify({ ok: true, status: "rejected" }));
}

async function approve() {
  if (!id) throw new Error("--id is required");
  const request = await prisma.moderationRequest.findUnique({ where: { id } });
  if (!request) throw new Error("request_not_found");
  if (request.status !== "pending") {
    console.log(JSON.stringify({ ok: true, status: request.status, id: request.id }));
    return;
  }
  const nextStatus = mapAction(request.requestedAction);
  let previousStatus = "unknown";
  let note = `管理员批准：${request.reason}`;

  if (request.targetType === "deal") {
    const deal = await prisma.deal.findUnique({ where: { id: request.targetId } });
    if (!deal) throw new Error("deal_not_found");
    previousStatus = deal.validationStatus;
    await prisma.deal.update({ where: { id: deal.id }, data: { validationStatus: nextStatus } });
  } else if (request.targetType === "review_item") {
    const item = await prisma.reviewItem.findUnique({ where: { id: request.targetId } });
    if (!item) throw new Error("review_item_not_found");
    previousStatus = item.status;
    await prisma.reviewItem.update({ where: { id: item.id }, data: { status: nextStatus === "valid" ? "approved" : nextStatus } });
    if (item.dealId) await prisma.deal.update({ where: { id: item.dealId }, data: { validationStatus: nextStatus } });
  } else if (request.targetType === "excluded_candidate") {
    const item = await prisma.excludedCandidate.findUnique({ where: { id: request.targetId } });
    if (!item) throw new Error("excluded_candidate_not_found");
    previousStatus = item.status;
    const targetStatus = nextStatus === "valid" ? "approved_pending_wind_enrichment" : nextStatus;
    await prisma.excludedCandidate.update({ where: { id: item.id }, data: { status: targetStatus } });
    note = nextStatus === "valid" ? `${note}；该排除项缺少完整交易字段，需本地Codex调用Wind补全后正式入库。` : note;
  }

  await prisma.moderationRequest.update({ where: { id }, data: { status: "approved", reviewedAt: new Date(), resolutionNote: note } });
  await logChange({ targetType: request.targetType, targetId: request.targetId, previousStatus, nextStatus, reason: request.reason, requestId: request.id });
  console.log(JSON.stringify({ ok: true, status: "approved", previousStatus, nextStatus }));
}

async function main() {
  if (command === "list") return list();
  if (command === "show") return show();
  if (command === "approve") return approve();
  if (command === "reject") return reject();
  throw new Error("Usage: node scripts/moderation.cjs list|show|approve|reject --id [request-id]");
}

main().finally(() => prisma.$disconnect()).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
