ALTER TABLE "DealSource"
  ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'wind_record',
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "linkStatus" TEXT NOT NULL DEFAULT 'valid',
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "windRecordId" TEXT;

ALTER TABLE "ExcludedCandidate"
  ADD COLUMN "buyerName" TEXT,
  ADD COLUMN "buyerTicker" TEXT,
  ADD COLUMN "targetName" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceTitle" TEXT,
  ADD COLUMN "linkStatus" TEXT NOT NULL DEFAULT 'not_publicly_available',
  ADD COLUMN "informationGaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "windRecordId" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'excluded',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "ModerationRequest" (
  "id" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "requestedAction" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "requestHash" TEXT NOT NULL,
  "dealId" TEXT,
  "reviewItemId" TEXT,
  "excludedCandidateId" TEXT,
  CONSTRAINT "ModerationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ManualSubmission" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "linkedDealId" TEXT,
  "linkedDealEventId" TEXT,
  "submissionHash" TEXT NOT NULL,
  CONSTRAINT "ManualSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatusChangeLog" (
  "id" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "previousStatus" TEXT NOT NULL,
  "nextStatus" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "moderationRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dealId" TEXT,
  "reviewItemId" TEXT,
  "excludedCandidateId" TEXT,
  CONSTRAINT "StatusChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModerationRequest_requestHash_key" ON "ModerationRequest"("requestHash");
CREATE INDEX "ModerationRequest_status_createdAt_idx" ON "ModerationRequest"("status", "createdAt");
CREATE UNIQUE INDEX "ManualSubmission_submissionHash_key" ON "ManualSubmission"("submissionHash");
CREATE INDEX "ManualSubmission_status_createdAt_idx" ON "ManualSubmission"("status", "createdAt");
CREATE INDEX "StatusChangeLog_targetType_targetId_idx" ON "StatusChangeLog"("targetType", "targetId");

ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_reviewItemId_fkey" FOREIGN KEY ("reviewItemId") REFERENCES "ReviewItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_excludedCandidateId_fkey" FOREIGN KEY ("excludedCandidateId") REFERENCES "ExcludedCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ManualSubmission" ADD CONSTRAINT "ManualSubmission_linkedDealId_fkey" FOREIGN KEY ("linkedDealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatusChangeLog" ADD CONSTRAINT "StatusChangeLog_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatusChangeLog" ADD CONSTRAINT "StatusChangeLog_reviewItemId_fkey" FOREIGN KEY ("reviewItemId") REFERENCES "ReviewItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatusChangeLog" ADD CONSTRAINT "StatusChangeLog_excludedCandidateId_fkey" FOREIGN KEY ("excludedCandidateId") REFERENCES "ExcludedCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
