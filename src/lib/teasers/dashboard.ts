import { prisma } from "@/lib/db";
import type { TeaserDashboardData, TeaserDocumentView } from "./types";
import { normalizeIndustry, normalizeRegion } from "./taxonomy";

const documentSelect = {
  id: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  sourceType: true,
  sourceLabel: true,
  originalUrl: true,
  status: true,
  versionLabel: true,
  documentType: true,
  documentDate: true,
  language: true,
  uploadedAt: true,
  processedAt: true,
  confidence: true,
  errorMessage: true
} as const;

function documentView(document: {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sourceType: string;
  sourceLabel: string | null;
  originalUrl: string | null;
  status: string;
  versionLabel: string | null;
  documentType: string | null;
  documentDate: Date | null;
  language: string | null;
  uploadedAt: Date;
  processedAt: Date | null;
  confidence: number | null;
  errorMessage: string | null;
}): TeaserDocumentView {
  return {
    ...document,
    documentDate: document.documentDate?.toISOString() ?? null,
    uploadedAt: document.uploadedAt.toISOString(),
    processedAt: document.processedAt?.toISOString() ?? null
  };
}

export async function readTeaserDashboard(): Promise<TeaserDashboardData> {
  try {
    const [opportunities, orphanDocuments] = await Promise.all([
      prisma.teaserOpportunity.findMany({
        where: { documents: { some: {} } },
        orderBy: { latestDocumentAt: "desc" },
        select: {
          id: true,
          projectCode: true,
          title: true,
          companyName: true,
          country: true,
          region: true,
          industry: true,
          subsector: true,
          businessSummary: true,
          industryOverview: true,
          companyOverview: true,
          productOverview: true,
          revenue: true,
          ebitda: true,
          netProfit: true,
          ebitdaMargin: true,
          revenueGrowth: true,
          ebitdaGrowth: true,
          netProfitGrowth: true,
          currency: true,
          revenueUsd: true,
          ebitdaUsd: true,
          netProfitUsd: true,
          fxRateToUsd: true,
          fxRateDate: true,
          financialYear: true,
          transactionType: true,
          advisor: true,
          advisorContactName: true,
          advisorContactEmail: true,
          advisorContactPhone: true,
          operatingLocations: true,
          companyHighlights: true,
          processStage: true,
          confidence: true,
          tags: true,
          latestDocumentAt: true,
          documents: { orderBy: { uploadedAt: "desc" }, select: documentSelect }
        }
      }),
      prisma.teaserDocument.findMany({
        where: { opportunityId: null },
        orderBy: { uploadedAt: "desc" },
        select: documentSelect
      })
    ]);

    return {
      opportunities: opportunities.map((item) => ({
        ...item,
        region: normalizeRegion(item.region, item.country),
        industry: normalizeIndustry(item.industry, [item.subsector, item.companyOverview, item.productOverview]),
        fxRateDate: item.fxRateDate?.toISOString() ?? null,
        latestDocumentAt: item.latestDocumentAt.toISOString(),
        documents: item.documents.map(documentView)
      })),
      orphanDocuments: orphanDocuments.map(documentView),
      databaseReady: true,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Unable to read teaser dashboard", error);
    return { opportunities: [], orphanDocuments: [], databaseReady: false, generatedAt: new Date().toISOString() };
  }
}
