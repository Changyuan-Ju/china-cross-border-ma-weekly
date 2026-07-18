import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUsdRate } from "./fx";
import { normalizeIndustry, normalizeRegion } from "./taxonomy";
import { readTeaserFile } from "./storage";

type ExtractionEvidence = {
  field: string;
  page: number | null;
  quote: string | null;
  confidence: number;
};

export type TeaserExtraction = {
  teaser_title_summary: string;
  project_code: string | null;
  company_name: string | null;
  company_name_en: string | null;
  document_type: string;
  document_language: string | null;
  document_date: string | null;
  country: string | null;
  region: string | null;
  industry: string | null;
  subsector: string | null;
  industry_overview: string | null;
  company_overview: string | null;
  product_overview: string | null;
  business_summary: string | null;
  revenue: number | null;
  ebitda: number | null;
  net_profit: number | null;
  ebitda_margin: number | null;
  revenue_growth: number | null;
  ebitda_growth: number | null;
  net_profit_growth: number | null;
  currency: string | null;
  financial_year: string | null;
  transaction_type: string | null;
  stake_offered: number | null;
  advisor: string | null;
  advisor_contact_name: string | null;
  advisor_contact_email: string | null;
  advisor_contact_phone: string | null;
  operating_locations: string[];
  company_highlights: string[];
  process_stage: "new" | "teaser" | "nda" | "cim" | "management_presentation" | "binding_offer" | "closed" | "unknown";
  tags: string[];
  page_count: number | null;
  confidence: number;
  field_evidence: ExtractionEvidence[];
  information_gaps: string[];
};

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    teaser_title_summary: { type: "string", description: "A concise Simplified Chinese title describing the anonymous target based only on the teaser, never inventing a company name" },
    project_code: nullableString("Project code or confidential project name"),
    company_name: nullableString("Target company name only when explicitly disclosed; otherwise null"),
    company_name_en: nullableString("English target company name only when explicitly disclosed"),
    document_type: { type: "string", description: "Teaser, information memorandum, presentation, financial pack, or other file type" },
    document_language: nullableString("Document language in Simplified Chinese, such as 中文, 英文, 中英双语, 西班牙文"),
    document_date: nullableString("Document date in YYYY-MM-DD when disclosed or reliably shown in the file"),
    country: nullableString("Headquarters country"),
    region: nullableString("Headquarters region"),
    industry: nullableString("Institutional primary industry classification in Simplified Chinese"),
    subsector: nullableString("Specific subsector in Simplified Chinese"),
    industry_overview: nullableString("Concise Simplified Chinese overview of the market and industry facts disclosed"),
    company_overview: nullableString("Detailed Simplified Chinese company introduction without guessing the name"),
    product_overview: nullableString("Simplified Chinese overview of products and services"),
    business_summary: nullableString("One-sentence Simplified Chinese factual business summary"),
    revenue: nullableNumber("Most recent disclosed revenue in millions of source currency"),
    ebitda: nullableNumber("Most recent disclosed EBITDA in millions of source currency"),
    net_profit: nullableNumber("Most recent disclosed net profit in millions of source currency"),
    ebitda_margin: nullableNumber("EBITDA margin in percentage points"),
    revenue_growth: nullableNumber("Revenue growth in percentage points"),
    ebitda_growth: nullableNumber("EBITDA growth in percentage points"),
    net_profit_growth: nullableNumber("Net profit growth in percentage points"),
    currency: nullableString("ISO 4217 source currency code"),
    financial_year: nullableString("Financial period used for headline figures"),
    transaction_type: nullableString("Sale, capital raise, carve-out, partnership or other process type"),
    stake_offered: nullableNumber("Stake offered in percentage points"),
    advisor: nullableString("Named sell-side financial adviser"),
    advisor_contact_name: nullableString("Adviser contact name exactly as disclosed"),
    advisor_contact_email: nullableString("Adviser contact email exactly as disclosed"),
    advisor_contact_phone: nullableString("Adviser contact phone exactly as disclosed"),
    operating_locations: { type: "array", items: { type: "string" }, description: "Countries, cities, facilities, or operating regions disclosed" },
    company_highlights: { type: "array", items: { type: "string" }, description: "Short Simplified Chinese investment highlights grounded in the document" },
    process_stage: { type: "string", enum: ["new", "teaser", "nda", "cim", "management_presentation", "binding_offer", "closed", "unknown"] },
    tags: { type: "array", items: { type: "string" } },
    page_count: { type: ["integer", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    field_evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          page: { type: ["integer", "null"] },
          quote: { type: ["string", "null"] },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        },
        required: ["field", "page", "quote", "confidence"]
      }
    },
    information_gaps: { type: "array", items: { type: "string" } }
  },
  required: [
    "teaser_title_summary", "project_code", "company_name", "company_name_en", "document_type", "document_language", "document_date",
    "country", "region", "industry", "subsector", "industry_overview", "company_overview", "product_overview", "business_summary",
    "revenue", "ebitda", "net_profit", "ebitda_margin", "revenue_growth", "ebitda_growth", "net_profit_growth", "currency", "financial_year",
    "transaction_type", "stake_offered", "advisor", "advisor_contact_name", "advisor_contact_email", "advisor_contact_phone",
    "operating_locations", "company_highlights", "process_stage", "tags", "page_count", "confidence", "field_evidence", "information_gaps"
  ]
};

export const teaserExtractionValidator = z.object({
  teaser_title_summary: z.string().min(2).max(160),
  project_code: z.string().nullable(),
  company_name: z.string().nullable(),
  company_name_en: z.string().nullable(),
  document_type: z.string().min(1).max(80),
  document_language: z.string().nullable(),
  document_date: z.string().nullable(),
  country: z.string().nullable(),
  region: z.string().nullable(),
  industry: z.string().nullable(),
  subsector: z.string().nullable(),
  industry_overview: z.string().nullable(),
  company_overview: z.string().nullable(),
  product_overview: z.string().nullable(),
  business_summary: z.string().nullable(),
  revenue: z.number().nullable(),
  ebitda: z.number().nullable(),
  net_profit: z.number().nullable(),
  ebitda_margin: z.number().nullable(),
  revenue_growth: z.number().nullable(),
  ebitda_growth: z.number().nullable(),
  net_profit_growth: z.number().nullable(),
  currency: z.string().nullable(),
  financial_year: z.string().nullable(),
  transaction_type: z.string().nullable(),
  stake_offered: z.number().nullable(),
  advisor: z.string().nullable(),
  advisor_contact_name: z.string().nullable(),
  advisor_contact_email: z.string().nullable(),
  advisor_contact_phone: z.string().nullable(),
  operating_locations: z.array(z.string()).max(30),
  company_highlights: z.array(z.string()).max(20),
  process_stage: z.enum(["new", "teaser", "nda", "cim", "management_presentation", "binding_offer", "closed", "unknown"]),
  tags: z.array(z.string()).max(30),
  page_count: z.number().int().nullable(),
  confidence: z.number().min(0).max(1),
  field_evidence: z.array(z.object({
    field: z.string(),
    page: z.number().int().nullable(),
    quote: z.string().nullable(),
    confidence: z.number().min(0).max(1)
  })).max(100),
  information_gaps: z.array(z.string()).max(50)
});

function nullableString(description: string) { return { type: ["string", "null"], description }; }
function nullableNumber(description: string) { return { type: ["number", "null"], description }; }

type DashScopeConfig = { apiKey: string; baseUrl: string; model: string };
type GeminiConfig = { apiKey: string; baseUrl: string; model: string };
export type TeaserExtractorProvider = "auto" | "qwen" | "gemini";

function dashScopeConfig(): DashScopeConfig | null {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.DASHSCOPE_BASE_URL?.trim() || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, ""),
    model: process.env.QWEN_TEASER_MODEL?.trim() || "qwen-doc-turbo"
  };
}

function geminiConfig(): GeminiConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.GEMINI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, ""),
    model: process.env.GEMINI_TEASER_MODEL?.trim() || "gemini-3.5-flash"
  };
}

export function hasTeaserExtractor() { return Boolean(dashScopeConfig() || geminiConfig()); }

function jsonFromModelContent(content: string) {
  const unfenced = content.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Qwen returned no JSON object");
  return JSON.parse(unfenced.slice(start, end + 1)) as unknown;
}

async function uploadToDashScope(config: DashScopeConfig, bytes: Buffer, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append("file", new Blob([Uint8Array.from(bytes)], { type: mimeType }), fileName);
  formData.append("purpose", "file-extract");
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/files`, {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}` },
      body: formData,
      signal: AbortSignal.timeout(75_000)
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new Error("Qwen file upload timed out after 75 seconds");
    throw error;
  }
  if (!response.ok) throw new Error(`Qwen file upload failed (${response.status}): ${(await response.text()).slice(0, 400)}`);
  const body = await response.json() as { id?: unknown };
  if (typeof body.id !== "string") throw new Error("Qwen file upload returned no file ID");
  return body.id;
}

function teaserExtractionPrompt() {
  return [
    "Convert this M&A teaser into one JSON object matching the supplied JSON Schema exactly.",
    "Extract only disclosed facts. Anonymous targets are normal: never infer a company name and use null when it is not explicitly disclosed.",
    "Write title and narrative fields in concise Simplified Chinese. Preserve project codes, names, emails and phone numbers exactly.",
    "Financial values must be in millions of the disclosed source currency; percentages must be percentage points.",
    "Return raw JSON only, without Markdown fences or commentary.",
    `JSON Schema: ${JSON.stringify(extractionSchema)}`
  ].join("\n");
}

async function extractWithDashScope(config: DashScopeConfig, fileId: string) {
  const prompt = teaserExtractionPrompt();

  const deadline = Date.now() + 190_000;
  let lastTimeout: Error | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs < 10_000) break;

    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: "You are a precise investment-banking teaser analyst and structured data extractor." },
            { role: "system", content: `fileid://${fileId}` },
            { role: "user", content: prompt }
          ],
          stream: false,
          temperature: 0
        }),
        signal: AbortSignal.timeout(Math.min(90_000, remainingMs))
      });
    } catch (error) {
      if (!isTimeoutError(error)) throw error;
      lastTimeout = new Error("Qwen document extraction request timed out");
      if (deadline - Date.now() < 12_000) break;
      await delay(1_500 + attempt * 500);
      continue;
    }
    const responseText = await response.text();
    if (!response.ok) {
      if (/parsing in progress|still parsing|try again later/i.test(responseText) && attempt < 7) {
        await delay(2_000 + attempt * 750);
        continue;
      }
      throw new Error(`Qwen extraction failed (${response.status}): ${responseText.slice(0, 400)}`);
    }
    const body = JSON.parse(responseText) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Qwen returned no structured output");
    return teaserExtractionValidator.parse(jsonFromModelContent(content));
  }
  throw lastTimeout ?? new Error("Qwen document parsing did not finish within 190 seconds");
}

async function extractWithGemini(config: GeminiConfig, bytes: Buffer, mimeType: string) {
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/models/${encodeURIComponent(config.model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": config.apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: bytes.toString("base64") } },
            { text: teaserExtractionPrompt() }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: extractionSchema,
          maxOutputTokens: 12_000
        }
      }),
      signal: AbortSignal.timeout(210_000)
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new Error("Gemini document extraction timed out after 210 seconds");
    throw error;
  }

  const responseText = await response.text();
  if (!response.ok) throw new Error(`Gemini extraction failed (${response.status}): ${responseText.slice(0, 400)}`);
  const body = JSON.parse(responseText) as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
  const content = body.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
  if (typeof content !== "string") throw new Error("Gemini returned no structured output");
  return teaserExtractionValidator.parse(jsonFromModelContent(content));
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError" || /timed?\s*out|timeout/i.test(error.message));
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function deleteDashScopeFile(config: DashScopeConfig, fileId: string) {
  await fetch(`${config.baseUrl}/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${config.apiKey}` },
    signal: AbortSignal.timeout(15_000)
  }).catch(() => undefined);
}

async function extractDocument(
  bytes: Buffer,
  fileName: string,
  mimeType: string,
  provider: TeaserExtractorProvider
) {
  const qwen = dashScopeConfig();
  const gemini = geminiConfig();

  if (provider === "qwen") {
    if (!qwen) throw new Error("Qwen extractor is not configured");
    return extractWithQwenDocument(qwen, bytes, fileName, mimeType);
  }
  if (provider === "gemini") {
    if (!gemini) throw new Error("Gemini extractor is not configured");
    return extractWithGemini(gemini, bytes, mimeType);
  }

  if (qwen) return extractWithQwenDocument(qwen, bytes, fileName, mimeType);
  throw new Error("Qwen extractor is not configured");
}

async function extractWithQwenDocument(config: DashScopeConfig, bytes: Buffer, fileName: string, mimeType: string) {
  const remoteFileId = await uploadToDashScope(config, bytes, fileName, mimeType);
  try {
    return await extractWithDashScope(config, remoteFileId);
  } finally {
    await deleteDashScopeFile(config, remoteFileId);
  }
}

export async function previewTeaserExtraction(documentId: string, provider: Exclude<TeaserExtractorProvider, "auto">) {
  const document = await prisma.teaserDocument.findUniqueOrThrow({ where: { id: documentId } });
  const bytes = await readTeaserFile(document.storageProvider, document.storageKey);
  return extractDocument(bytes, document.fileName, document.mimeType, provider);
}

export async function processTeaserDocument(documentId: string, options: { force?: boolean; provider?: TeaserExtractorProvider } = {}) {
  if (!hasTeaserExtractor()) return;
  const document = await prisma.teaserDocument.findUnique({ where: { id: documentId } });
  if (!document || (document.status === "completed" && !options.force)) return;

  await prisma.teaserDocument.update({ where: { id: documentId }, data: { status: "processing", errorMessage: null } });
  try {
    const bytes = await readTeaserFile(document.storageProvider, document.storageKey);
    const extraction = await extractDocument(bytes, document.fileName, document.mimeType, options.provider ?? "auto");
    await applyTeaserExtraction(document.id, extraction);
  } catch (error) {
    await prisma.teaserDocument.update({
      where: { id: documentId },
      data: { status: "failed", errorMessage: error instanceof Error ? error.message.slice(0, 800) : "Unknown extraction error" }
    });
  }
}

export async function applyTeaserExtraction(documentId: string, input: TeaserExtraction) {
  const extraction = teaserExtractionValidator.parse(input);
  const document = await prisma.teaserDocument.findUniqueOrThrow({ where: { id: documentId } });
  const fx = await getUsdRate(extraction.currency, document.uploadedAt);
  const opportunity = await upsertOpportunity(document.fileName, document.uploadedAt, extraction, fx, document.opportunityId);

  await prisma.$transaction([
    prisma.teaserDocument.update({
      where: { id: documentId },
      data: {
        opportunityId: opportunity.id,
        status: "completed",
        documentType: extraction.document_type,
        documentDate: parseDocumentDate(extraction.document_date),
        language: extraction.document_language,
        pageCount: extraction.page_count,
        processedAt: new Date(),
        extractedData: extraction,
        fieldEvidence: extraction.field_evidence,
        confidence: extraction.confidence,
        versionLabel: `V${opportunity.documentCount + 1}`,
        errorMessage: null
      }
    }),
    prisma.teaserReviewItem.deleteMany({ where: { documentId } })
  ]);
}

async function upsertOpportunity(
  fileName: string,
  receivedAt: Date,
  extraction: TeaserExtraction,
  fx: { rate: number; date: Date } | null,
  currentOpportunityId: string | null
) {
  const matchTerms = [extraction.project_code, extraction.company_name].filter(Boolean) as string[];
  const existing = await prisma.teaserOpportunity.findFirst({
    where: currentOpportunityId
      ? { id: currentOpportunityId }
      : matchTerms.length
        ? { OR: matchTerms.flatMap((term) => [
          { projectCode: { equals: term, mode: "insensitive" as const } },
          { companyName: { equals: term, mode: "insensitive" as const } }
        ]) }
        : { documents: { some: { fileName: { equals: fileName, mode: "insensitive" as const } } } },
    include: { _count: { select: { documents: true } } }
  });

  const data = {
    projectCode: extraction.project_code,
    title: extraction.teaser_title_summary || extraction.project_code || fileName.replace(/\.[^.]+$/, ""),
    companyName: extraction.company_name,
    companyNameEn: extraction.company_name_en,
    country: extraction.country,
    region: normalizeRegion(extraction.region, extraction.country),
    industry: normalizeIndustry(extraction.industry, [extraction.subsector, extraction.company_overview, extraction.product_overview]),
    subsector: extraction.subsector,
    businessSummary: extraction.business_summary,
    industryOverview: extraction.industry_overview,
    companyOverview: extraction.company_overview,
    productOverview: extraction.product_overview,
    revenue: extraction.revenue,
    ebitda: extraction.ebitda,
    netProfit: extraction.net_profit,
    ebitdaMargin: extraction.ebitda_margin,
    revenueGrowth: extraction.revenue_growth,
    ebitdaGrowth: extraction.ebitda_growth,
    netProfitGrowth: extraction.net_profit_growth,
    currency: extraction.currency?.toUpperCase() ?? null,
    revenueUsd: convertToUsd(extraction.revenue, fx),
    ebitdaUsd: convertToUsd(extraction.ebitda, fx),
    netProfitUsd: convertToUsd(extraction.net_profit, fx),
    fxRateToUsd: fx?.rate ?? null,
    fxRateDate: fx?.date ?? null,
    financialYear: extraction.financial_year,
    transactionType: extraction.transaction_type,
    stakeOffered: extraction.stake_offered,
    advisor: extraction.advisor,
    advisorContactName: extraction.advisor_contact_name,
    advisorContactEmail: extraction.advisor_contact_email,
    advisorContactPhone: extraction.advisor_contact_phone,
    operatingLocations: uniqueStrings(extraction.operating_locations),
    companyHighlights: uniqueStrings(extraction.company_highlights),
    processStage: extraction.process_stage,
    reviewStatus: "structured",
    confidence: extraction.confidence,
    tags: uniqueStrings(extraction.tags).slice(0, 20),
    latestDocumentAt: receivedAt
  };

  if (existing) {
    const updated = await prisma.teaserOpportunity.update({ where: { id: existing.id }, data });
    return { id: updated.id, documentCount: existing._count.documents };
  }
  const created = await prisma.teaserOpportunity.create({ data });
  return { id: created.id, documentCount: 0 };
}

function parseDocumentDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function convertToUsd(value: number | null, fx: { rate: number } | null) {
  return value === null || !fx ? null : value * fx.rate;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
