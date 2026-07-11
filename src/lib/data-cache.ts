import { revalidateTag } from "next/cache";

export const PUBLIC_DATA_CACHE_TAG = "public-weekly-data";
export const CANDIDATE_DATA_CACHE_TAG = "candidate-weekly-data";
export const DATA_CACHE_SECONDS = 60;

export function invalidateWeeklyDataCache() {
  safelyRevalidate(PUBLIC_DATA_CACHE_TAG);
  safelyRevalidate(CANDIDATE_DATA_CACHE_TAG);
}

export function invalidateCandidateDataCache() {
  safelyRevalidate(CANDIDATE_DATA_CACHE_TAG);
}

function safelyRevalidate(tag: string) {
  try {
    revalidateTag(tag);
  } catch {
    // Direct unit-test calls and local scripts may not have a Next request cache context.
    // The one-minute TTL remains the fallback freshness guarantee.
  }
}
