const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
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

function requireArg(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function toJson(value) {
  return JSON.stringify(value, (_key, item) => iso(item), 2);
}

async function readTarget(request) {
  if (request.targetType === "deal") {
    return prisma.deal.findUnique({
      where: { id: request.targetId },
      select: { id: true, articleTitle: true, validationStatus: true, latestAnnouncementDate: true }
    });
  }
  if (request.targetType === "review_item") {
    return prisma.reviewItem.findUnique({
      where: { id: request.targetId },
      select: { id: true, reason: true, status: true, dealId: true, payload: true }
    });
  }
  if (request.targetType === "excluded_candidate") {
    return prisma.excludedCandidate.findUnique({
      where: { id: request.targetId },
      select: { id: true, announcementTitle: true, sourceUrl: true, exclusionReason: true, status: true }
    });
  }
  if (request.targetType === "manual_submission") {
    return prisma.manualSubmission.findUnique({
      where: { id: request.targetId },
      select: { id: true, title: true, sourceUrl: true, status: true, linkedDealId: true }
    });
  }
  return null;
}

async function list() {
  const submissions = await prisma.manualSubmission.findMany({
    where: { status: { in: ["submitted", "review_required", "approved_pending_wind_enrichment", "needs_manual_review"] } },
    orderBy: { createdAt: "asc" },
    take: 100
  });
  const requests = await prisma.moderationRequest.findMany({
    where: { status: { in: ["pending", "needs_manual_review"] } },
    orderBy: { createdAt: "asc" },
    take: 100
  });
  const moderation = [];
  for (const request of requests) {
    moderation.push({ ...request, target: await readTarget(request) });
  }
  console.log(toJson({ generatedAt: new Date(), submissions, moderation }));
}

function requestedTargetStatus(targetType, requestedAction) {
  if (requestedAction === "exclude") return "rejected";
  if (requestedAction === "review_required") return "review_required";
  if (targetType === "review_item") return "approved";
  if (targetType === "excluded_candidate" || targetType === "manual_submission") return "approved_pending_wind_enrichment";
  return "valid";
}

async function createStatusLog(tx, { targetType, targetId, previousStatus, nextStatus, reason, moderationRequestId }) {
  await tx.statusChangeLog.create({
    data: {
      id: randomUUID(),
      targetType,
      targetId,
      previousStatus,
      nextStatus,
      reason,
      moderationRequestId,
      dealId: targetType === "deal" ? targetId : undefined,
      reviewItemId: targetType === "review_item" ? targetId : undefined,
      excludedCandidateId: targetType === "excluded_candidate" ? targetId : undefined
    }
  });
}

async function applyModeration(tx, request, note) {
  const nextStatus = requestedTargetStatus(request.targetType, request.requestedAction);
  let previousStatus;

  if (request.targetType === "deal") {
    const target = await tx.deal.findUnique({ where: { id: request.targetId } });
    if (!target) throw new Error("deal_not_found");
    previousStatus = target.validationStatus;
    await tx.deal.update({ where: { id: target.id }, data: { validationStatus: nextStatus } });
  } else if (request.targetType === "review_item") {
    const target = await tx.reviewItem.findUnique({ where: { id: request.targetId } });
    if (!target) throw new Error("review_item_not_found");
    previousStatus = target.status;
    await tx.reviewItem.update({ where: { id: target.id }, data: { status: nextStatus } });
    if (target.dealId) {
      const dealStatus = nextStatus === "approved" ? "valid" : nextStatus;
      await tx.deal.update({ where: { id: target.dealId }, data: { validationStatus: dealStatus } });
    }
  } else if (request.targetType === "excluded_candidate") {
    const target = await tx.excludedCandidate.findUnique({ where: { id: request.targetId } });
    if (!target) throw new Error("excluded_candidate_not_found");
    previousStatus = target.status;
    await tx.excludedCandidate.update({ where: { id: target.id }, data: { status: nextStatus } });
  } else if (request.targetType === "manual_submission") {
    const target = await tx.manualSubmission.findUnique({ where: { id: request.targetId } });
    if (!target) throw new Error("manual_submission_not_found");
    previousStatus = target.status;
    await tx.manualSubmission.update({
      where: { id: target.id },
      data: { status: nextStatus, reviewedAt: new Date(), reviewNote: note }
    });
  } else {
    throw new Error("unsupported_target_type");
  }

  if (previousStatus !== nextStatus) {
    await createStatusLog(tx, {
      targetType: request.targetType,
      targetId: request.targetId,
      previousStatus,
      nextStatus,
      reason: note,
      moderationRequestId: request.id
    });
  }
  return { previousStatus, nextStatus };
}

async function resolveModeration() {
  const id = requireArg("--id");
  const decision = requireArg("--decision");
  const note = requireArg("--note").trim();
  if (!["approve", "reject", "needs_manual_review"].includes(decision)) throw new Error("invalid_decision");
  if (note.length < 8) throw new Error("--note must contain an evidence-based explanation");

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.moderationRequest.findUnique({ where: { id } });
    if (!request) throw new Error("request_not_found");
    if (!["pending", "needs_manual_review"].includes(request.status)) {
      return { ok: true, id, status: request.status, idempotent: true };
    }

    let applied;
    if (decision === "approve") applied = await applyModeration(tx, request, note);
    const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "needs_manual_review";
    await tx.moderationRequest.update({
      where: { id },
      data: { status, reviewedAt: new Date(), resolutionNote: note }
    });
    return { ok: true, id, status, applied };
  });
  console.log(toJson(result));
}

async function resolveSubmission() {
  const id = requireArg("--id");
  const decision = requireArg("--decision");
  const note = requireArg("--note").trim();
  const dealId = arg("--deal-id");
  const eventId = arg("--event-id");
  if (!["approved", "duplicate", "rejected", "needs_manual_review"].includes(decision)) throw new Error("invalid_decision");
  if (note.length < 8) throw new Error("--note must contain an evidence-based explanation");
  if (["approved", "duplicate"].includes(decision) && !dealId) throw new Error("--deal-id is required after a successful match or ingest");

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.manualSubmission.findUnique({ where: { id } });
    if (!item) throw new Error("submission_not_found");
    if (["approved", "duplicate", "rejected"].includes(item.status)) {
      return { ok: true, id, status: item.status, idempotent: true };
    }
    if (dealId) {
      const deal = await tx.deal.findUnique({ where: { id: dealId }, select: { id: true } });
      if (!deal) throw new Error("deal_not_found");
    }
    if (eventId) {
      const event = await tx.dealEvent.findUnique({ where: { id: eventId }, select: { dealId: true } });
      if (!event || event.dealId !== dealId) throw new Error("event_not_found_or_deal_mismatch");
    }
    await tx.manualSubmission.update({
      where: { id },
      data: {
        status: decision,
        reviewedAt: new Date(),
        reviewNote: note,
        linkedDealId: dealId,
        linkedDealEventId: eventId
      }
    });
    if (item.status !== decision) {
      await createStatusLog(tx, {
        targetType: "manual_submission",
        targetId: id,
        previousStatus: item.status,
        nextStatus: decision,
        reason: note
      });
    }
    return { ok: true, id, status: decision, linkedDealId: dealId, linkedDealEventId: eventId };
  });
  console.log(toJson(result));
}

async function main() {
  const command = process.argv[2];
  if (command === "list") return list();
  if (command === "resolve-moderation") return resolveModeration();
  if (command === "resolve-submission") return resolveSubmission();
  throw new Error("Usage: process-feedback.cjs list | resolve-moderation --id ... --decision approve|reject|needs_manual_review --note ... | resolve-submission --id ... --decision approved|duplicate|rejected|needs_manual_review --note ... [--deal-id ...] [--event-id ...]");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
