CREATE TABLE "Deal" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "buyerNameCn" TEXT NOT NULL,
  "buyerNameEn" TEXT,
  "buyerTicker" TEXT,
  "sellerNames" TEXT[],
  "targetNameCn" TEXT NOT NULL,
  "targetNameEn" TEXT,
  "targetCountry" TEXT,
  "targetAssetLocation" TEXT,
  "targetIndustry" TEXT,
  "targetBusiness" TEXT,
  "dealDirection" TEXT NOT NULL,
  "transactionType" TEXT NOT NULL,
  "stakeBefore" DOUBLE PRECISION,
  "stakeChange" DOUBLE PRECISION,
  "stakeAfter" DOUBLE PRECISION,
  "obtainsControl" BOOLEAN,
  "considerationAmount" DOUBLE PRECISION,
  "considerationCurrency" TEXT,
  "considerationText" TEXT,
  "paymentMethods" TEXT[],
  "currentStage" TEXT NOT NULL,
  "currentStatus" TEXT NOT NULL,
  "articleTitle" TEXT NOT NULL,
  "articleBody" TEXT NOT NULL,
  "informationGaps" TEXT[],
  "visibleTags" TEXT[],
  "importanceScore" INTEGER NOT NULL,
  "importanceBreakdown" JSONB NOT NULL,
  "validationStatus" TEXT NOT NULL,
  "manualPriority" INTEGER,
  "firstAnnouncementDate" TIMESTAMP(3) NOT NULL,
  "latestAnnouncementDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Deal_fingerprint_key" ON "Deal"("fingerprint");

CREATE TABLE "DealEvent" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "announcementDate" TIMESTAMP(3) NOT NULL,
  "announcementType" TEXT NOT NULL,
  "transactionStage" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "sourceData" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  "sourceFingerprint" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealEvent_sourceFingerprint_key" ON "DealEvent"("sourceFingerprint");

CREATE TABLE "DealSource" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "eventId" TEXT,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publisher" TEXT,
  "publishedAt" TIMESTAMP(3),
  "sourceFingerprint" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealSource_sourceFingerprint_key" ON "DealSource"("sourceFingerprint");

CREATE TABLE "WeeklyIssue" (
  "id" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "dealIds" TEXT[],
  "candidateCount" INTEGER NOT NULL,
  "includedCount" INTEGER NOT NULL,
  "excludedCount" INTEGER NOT NULL,
  "reviewRequiredCount" INTEGER NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionRun" (
  "id" TEXT NOT NULL,
  "issueId" TEXT,
  "runStartedAt" TIMESTAMP(3) NOT NULL,
  "runCompletedAt" TIMESTAMP(3),
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "candidateCount" INTEGER NOT NULL,
  "includedCount" INTEGER NOT NULL,
  "excludedCount" INTEGER NOT NULL,
  "reviewRequiredCount" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "excludedItems" JSONB NOT NULL,
  "errors" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExcludedCandidate" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "candidateName" TEXT NOT NULL,
  "announcementDate" TIMESTAMP(3),
  "announcementTitle" TEXT NOT NULL,
  "source" TEXT,
  "exclusionReason" TEXT NOT NULL,
  "mayReconsider" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExcludedCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewItem" (
  "id" TEXT NOT NULL,
  "runId" TEXT,
  "dealId" TEXT,
  "reason" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReviewItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealSource" ADD CONSTRAINT "DealSource_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealSource" ADD CONSTRAINT "DealSource_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DealEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExcludedCandidate" ADD CONSTRAINT "ExcludedCandidate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
