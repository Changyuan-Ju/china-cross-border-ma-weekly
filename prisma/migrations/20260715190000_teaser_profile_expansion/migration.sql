ALTER TABLE "TeaserOpportunity"
ADD COLUMN "industryOverview" TEXT,
ADD COLUMN "companyOverview" TEXT,
ADD COLUMN "productOverview" TEXT,
ADD COLUMN "netProfit" DOUBLE PRECISION,
ADD COLUMN "ebitdaGrowth" DOUBLE PRECISION,
ADD COLUMN "netProfitGrowth" DOUBLE PRECISION,
ADD COLUMN "revenueUsd" DOUBLE PRECISION,
ADD COLUMN "ebitdaUsd" DOUBLE PRECISION,
ADD COLUMN "netProfitUsd" DOUBLE PRECISION,
ADD COLUMN "fxRateToUsd" DOUBLE PRECISION,
ADD COLUMN "fxRateDate" TIMESTAMP(3),
ADD COLUMN "advisorContactName" TEXT,
ADD COLUMN "advisorContactEmail" TEXT,
ADD COLUMN "advisorContactPhone" TEXT,
ADD COLUMN "operatingLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "companyHighlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "TeaserDocument"
ADD COLUMN "documentType" TEXT,
ADD COLUMN "documentDate" TIMESTAMP(3);
