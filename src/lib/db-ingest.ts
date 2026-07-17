import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { makeSourceFingerprint } from "./deal-utils";
import { buildIssueSummary } from "./format";
import { dedupeTags } from "./tag-utils";
import type { Deal, WeeklyPayload } from "./types";

export async function upsertWeeklyPayloadToDatabase(payload: WeeklyPayload) {
  const runId = `run-${payload.run_started_at}`;
  const issueId = `${payload.issue_start_date}-to-${payload.issue_end_date}`;
  const validDeals = payload.deals;
  const issueSummary = buildIssueSummary(payload.included_count);

  await prisma.ingestionRun.upsert({
    where: { id: runId },
    update: {
      issueId,
      runCompletedAt: new Date(payload.run_completed_at),
      fromDate: new Date(payload.issue_start_date),
      toDate: new Date(payload.issue_end_date),
      candidateCount: payload.candidate_count,
      includedCount: payload.included_count,
      excludedCount: payload.excluded_count,
      reviewRequiredCount: 0,
      status: payload.errors.length ? "completed_with_errors" : "completed",
      payload: payload as object,
      errors: payload.errors,
      excludedItems: payload.excluded_items as object
    },
    create: {
      id: runId,
      issueId,
      runStartedAt: new Date(payload.run_started_at),
      runCompletedAt: new Date(payload.run_completed_at),
      fromDate: new Date(payload.issue_start_date),
      toDate: new Date(payload.issue_end_date),
      candidateCount: payload.candidate_count,
      includedCount: payload.included_count,
      excludedCount: payload.excluded_count,
      reviewRequiredCount: 0,
      status: payload.errors.length ? "completed_with_errors" : "completed",
      payload: payload as object,
      excludedItems: payload.excluded_items as object,
      errors: payload.errors
    }
  });

  await prisma.excludedCandidate.deleteMany({ where: { runId } });
  await prisma.reviewItem.deleteMany({ where: { runId } });
  for (const deal of validDeals) await upsertDeal(deal);
  for (const item of payload.excluded_items) {
    await prisma.excludedCandidate.create({
      data: {
        id: randomUUID(),
        runId,
        candidateName: item.candidate_name,
        buyerName: item.buyer_name,
        buyerTicker: item.buyer_ticker,
        targetName: item.target_name,
        announcementDate: item.announcement_date ? new Date(item.announcement_date) : null,
        announcementTitle: item.announcement_title,
        source: item.source,
        sourceUrl: item.source_url,
        sourceTitle: item.source_title,
        linkStatus: item.link_status ?? "not_publicly_available",
        informationGaps: item.information_gaps ?? [],
        windRecordId: item.wind_record_id,
        exclusionReason: item.exclusion_reason,
        mayReconsider: item.may_reconsider
      }
    });
  }

  await prisma.weeklyIssue.upsert({
    where: { id: issueId },
    update: {
      summary: issueSummary,
      dealIds: validDeals.map((deal) => deal.canonical_deal_id),
      candidateCount: payload.candidate_count,
      includedCount: payload.included_count,
      excludedCount: payload.excluded_count,
      reviewRequiredCount: 0,
      publishedAt: new Date(payload.run_completed_at)
    },
    create: {
      id: issueId,
      startDate: new Date(payload.issue_start_date),
      endDate: new Date(payload.issue_end_date),
      title: `${payload.issue_start_date} to ${payload.issue_end_date} Cross-border M&A Weekly`,
      summary: issueSummary,
      dealIds: validDeals.map((deal) => deal.canonical_deal_id),
      candidateCount: payload.candidate_count,
      includedCount: payload.included_count,
      excludedCount: payload.excluded_count,
      reviewRequiredCount: 0,
      publishedAt: new Date(payload.run_completed_at)
    }
  });

  return { issueId, accepted: validDeals.length };
}

async function upsertDeal(deal: Deal) {
  await prisma.deal.upsert({
    where: { id: deal.canonical_deal_id },
    update: {
      buyerNameCn: deal.buyer_name_cn,
      buyerNameEn: deal.buyer_name_en,
      buyerTicker: deal.buyer_ticker,
      sellerNames: deal.seller_names,
      targetNameCn: deal.target_name_cn,
      targetNameEn: deal.target_name_en,
      targetCountry: deal.target_country_or_region,
      targetAssetLocation: deal.target_primary_asset_location,
      targetIndustry: deal.target_industry,
      targetBusiness: deal.target_business,
      dealDirection: deal.deal_direction,
      transactionType: deal.transaction_type,
      stakeBefore: deal.stake_before,
      stakeChange: deal.stake_change,
      stakeAfter: deal.stake_after,
      obtainsControl: deal.obtains_control,
      considerationAmount: deal.consideration_amount,
      considerationCurrency: deal.consideration_currency,
      considerationText: deal.consideration_text,
      paymentMethods: deal.payment_methods,
      currentStage: deal.transaction_stage,
      currentStatus: deal.current_status,
      latestAnnouncementDate: new Date(deal.announcement_date),
      articleTitle: deal.article_title,
      articleBody: deal.article_body,
      detailedSummary: deal.detailed_summary,
      transactionFacts: deal.transaction_facts,
      transactionStructure: deal.transaction_structure,
      targetProfile: deal.target_profile as object | undefined,
      targetFinancials: deal.target_financials as object | undefined,
      considerationBreakdown: deal.consideration_breakdown as object | undefined,
      pricingBasis: deal.pricing_basis,
      approvalsAndConditions: deal.approvals_and_conditions as object | undefined,
      keyDates: deal.key_dates as object | undefined,
      fieldEvidence: deal.field_evidence as object | undefined,
      lastVerifiedAt: deal.last_verified_at ? new Date(deal.last_verified_at) : undefined,
      isManualSupplement: deal.is_manual_supplement ?? false,
      informationGaps: deal.information_gaps,
      visibleTags: dedupeTags(deal.visible_tags),
      importanceScore: deal.importance_score,
      importanceBreakdown: deal.importance_score_breakdown,
      validationStatus: "valid",
      manualPriority: deal.manual_priority
    },
    create: {
      id: deal.canonical_deal_id,
      fingerprint: deal.deal_fingerprint,
      buyerNameCn: deal.buyer_name_cn,
      buyerNameEn: deal.buyer_name_en,
      buyerTicker: deal.buyer_ticker,
      sellerNames: deal.seller_names,
      targetNameCn: deal.target_name_cn,
      targetNameEn: deal.target_name_en,
      targetCountry: deal.target_country_or_region,
      targetAssetLocation: deal.target_primary_asset_location,
      targetIndustry: deal.target_industry,
      targetBusiness: deal.target_business,
      dealDirection: deal.deal_direction,
      transactionType: deal.transaction_type,
      stakeBefore: deal.stake_before,
      stakeChange: deal.stake_change,
      stakeAfter: deal.stake_after,
      obtainsControl: deal.obtains_control,
      considerationAmount: deal.consideration_amount,
      considerationCurrency: deal.consideration_currency,
      considerationText: deal.consideration_text,
      paymentMethods: deal.payment_methods,
      currentStage: deal.transaction_stage,
      currentStatus: deal.current_status,
      articleTitle: deal.article_title,
      articleBody: deal.article_body,
      detailedSummary: deal.detailed_summary,
      transactionFacts: deal.transaction_facts,
      transactionStructure: deal.transaction_structure,
      targetProfile: deal.target_profile as object | undefined,
      targetFinancials: deal.target_financials as object | undefined,
      considerationBreakdown: deal.consideration_breakdown as object | undefined,
      pricingBasis: deal.pricing_basis,
      approvalsAndConditions: deal.approvals_and_conditions as object | undefined,
      keyDates: deal.key_dates as object | undefined,
      fieldEvidence: deal.field_evidence as object | undefined,
      lastVerifiedAt: deal.last_verified_at ? new Date(deal.last_verified_at) : null,
      isManualSupplement: deal.is_manual_supplement ?? false,
      informationGaps: deal.information_gaps,
      visibleTags: dedupeTags(deal.visible_tags),
      importanceScore: deal.importance_score,
      importanceBreakdown: deal.importance_score_breakdown,
      validationStatus: deal.validation_status,
      manualPriority: deal.manual_priority,
      firstAnnouncementDate: new Date(deal.announcement_date),
      latestAnnouncementDate: new Date(deal.announcement_date)
    }
  });

  await upsertEventAndSources(deal);
}

async function upsertEventAndSources(deal: Deal) {
  const source = deal.sources[0];
  const sourceFingerprint = makeSourceFingerprint(source.url, source.title, deal.announcement_date);
  const announcementDate = new Date(deal.announcement_date);
  const existingEvent = await prisma.dealEvent.findFirst({
    where: {
      OR: [
        { sourceFingerprint },
        { dealId: deal.canonical_deal_id, announcementDate, announcementType: deal.announcement_type }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
  const eventId = existingEvent?.id ?? sourceFingerprint;
  if (existingEvent) {
    await prisma.dealEvent.update({
      where: { id: existingEvent.id },
      data: {
        announcementDate,
        announcementType: deal.announcement_type,
        transactionStage: deal.transaction_stage,
        title: deal.article_title,
        body: deal.article_body,
        sourceData: deal.sources as object,
        evidence: deal.evidence
      }
    });
  } else {
    await prisma.dealEvent.create({ data: {
      id: sourceFingerprint,
      dealId: deal.canonical_deal_id,
      announcementDate,
      announcementType: deal.announcement_type,
      transactionStage: deal.transaction_stage,
      title: deal.article_title,
      body: deal.article_body,
      sourceData: deal.sources as object,
      evidence: deal.evidence,
      sourceFingerprint
    } });
  }

  for (const item of deal.sources) {
    const itemFingerprint = makeSourceFingerprint(item.url, item.title, item.published_at);
    await prisma.dealSource.upsert({
      where: { sourceFingerprint: itemFingerprint },
      update: {
        dealId: deal.canonical_deal_id,
        eventId,
        title: item.title,
        url: item.url,
        publisher: item.publisher,
        sourceType: item.source_type ?? "wind_record",
        isPrimary: item.is_primary ?? item === deal.sources[0],
        linkStatus: item.link_status ?? (item.url ? "valid" : "not_publicly_available"),
        lastVerifiedAt: item.last_verified_at ? new Date(item.last_verified_at) : null,
        windRecordId: item.wind_record_id
      },
      create: {
        id: itemFingerprint,
        dealId: deal.canonical_deal_id,
        eventId,
        title: item.title,
        url: item.url,
        publisher: item.publisher,
        sourceType: item.source_type ?? "wind_record",
        isPrimary: item.is_primary ?? item === deal.sources[0],
        linkStatus: item.link_status ?? (item.url ? "valid" : "not_publicly_available"),
        lastVerifiedAt: item.last_verified_at ? new Date(item.last_verified_at) : null,
        windRecordId: item.wind_record_id,
        publishedAt: item.published_at ? new Date(item.published_at) : null,
        sourceFingerprint: itemFingerprint
      }
    });
  }
}
