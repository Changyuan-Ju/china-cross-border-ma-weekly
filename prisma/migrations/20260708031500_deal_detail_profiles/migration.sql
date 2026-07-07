ALTER TABLE "Deal"
  ADD COLUMN "detailedSummary" TEXT,
  ADD COLUMN "transactionFacts" TEXT,
  ADD COLUMN "transactionStructure" TEXT,
  ADD COLUMN "targetProfile" JSONB,
  ADD COLUMN "targetFinancials" JSONB,
  ADD COLUMN "considerationBreakdown" JSONB,
  ADD COLUMN "pricingBasis" TEXT,
  ADD COLUMN "approvalsAndConditions" JSONB,
  ADD COLUMN "keyDates" JSONB,
  ADD COLUMN "fieldEvidence" JSONB,
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "isManualSupplement" BOOLEAN NOT NULL DEFAULT false;
