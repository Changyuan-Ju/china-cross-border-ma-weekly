CREATE TABLE "TeaserOpportunity" (
  "id" TEXT NOT NULL,
  "projectCode" TEXT,
  "title" TEXT NOT NULL,
  "companyName" TEXT,
  "companyNameEn" TEXT,
  "country" TEXT,
  "region" TEXT,
  "industry" TEXT,
  "subsector" TEXT,
  "businessSummary" TEXT,
  "revenue" DOUBLE PRECISION,
  "ebitda" DOUBLE PRECISION,
  "ebitdaMargin" DOUBLE PRECISION,
  "revenueGrowth" DOUBLE PRECISION,
  "currency" TEXT,
  "financialYear" TEXT,
  "transactionType" TEXT,
  "stakeOffered" DOUBLE PRECISION,
  "advisor" TEXT,
  "processStage" TEXT NOT NULL DEFAULT 'new',
  "reviewStatus" TEXT NOT NULL DEFAULT 'review_required',
  "confidence" DOUBLE PRECISION,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "latestDocumentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeaserOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeaserDocument" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT,
  "fingerprint" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageProvider" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "storageUrl" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "originalUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "versionLabel" TEXT,
  "language" TEXT,
  "pageCount" INTEGER,
  "uploadedBy" TEXT NOT NULL DEFAULT 'Changyuan Ju',
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "extractedData" JSONB,
  "fieldEvidence" JSONB,
  "confidence" DOUBLE PRECISION,

  CONSTRAINT "TeaserDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeaserReviewItem" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "type" TEXT NOT NULL,
  "fieldName" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,

  CONSTRAINT "TeaserReviewItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeaserSourceConnection" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'not_configured',
  "localPath" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeaserSourceConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeaserDocument_fingerprint_key" ON "TeaserDocument"("fingerprint");
CREATE INDEX "TeaserOpportunity_industry_idx" ON "TeaserOpportunity"("industry");
CREATE INDEX "TeaserOpportunity_country_idx" ON "TeaserOpportunity"("country");
CREATE INDEX "TeaserOpportunity_reviewStatus_idx" ON "TeaserOpportunity"("reviewStatus");
CREATE INDEX "TeaserOpportunity_latestDocumentAt_idx" ON "TeaserOpportunity"("latestDocumentAt");
CREATE INDEX "TeaserDocument_status_idx" ON "TeaserDocument"("status");
CREATE INDEX "TeaserDocument_sourceType_idx" ON "TeaserDocument"("sourceType");
CREATE INDEX "TeaserDocument_uploadedAt_idx" ON "TeaserDocument"("uploadedAt");
CREATE INDEX "TeaserReviewItem_status_idx" ON "TeaserReviewItem"("status");
CREATE INDEX "TeaserReviewItem_createdAt_idx" ON "TeaserReviewItem"("createdAt");
CREATE UNIQUE INDEX "TeaserSourceConnection_type_name_key" ON "TeaserSourceConnection"("type", "name");

ALTER TABLE "TeaserDocument"
  ADD CONSTRAINT "TeaserDocument_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "TeaserOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TeaserReviewItem"
  ADD CONSTRAINT "TeaserReviewItem_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "TeaserDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeaserReviewItem"
  ADD CONSTRAINT "TeaserReviewItem_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "TeaserOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
