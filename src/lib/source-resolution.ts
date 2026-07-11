import type { DealSource } from "./types";

export function normalizeSource(source: DealSource): DealSource {
  return {
    ...source,
    title: source.title.trim(),
    url: source.url.trim(),
    link_status: source.link_status ?? (source.url ? "valid" : "not_publicly_available")
  };
}

export function validateSources(sources: DealSource[]) {
  const errors: string[] = [];
  for (const source of sources) {
    if (source.link_status === "not_publicly_available" && !source.url) continue;
    try {
      const url = new URL(source.url);
      if (!["http:", "https:"].includes(url.protocol)) errors.push(`unsupported_source_protocol:${source.url}`);
      if (isSearchResultSource(source.url)) errors.push(`search_result_source_not_allowed:${source.url}`);
    } catch {
      errors.push(`invalid_source_url:${source.url}`);
    }
  }
  return errors;
}

export const officialSourcePriority = [
  "exchange_pdf",
  "exchange_detail",
  "hkex_pdf",
  "company_ir_pdf",
  "regulator_pdf",
  "cninfo_direct",
  "company_ir_page",
  "public_announcement_mirror",
  "wind_record"
];

export function isSearchResultSource(url: string) {
  return /(?:google\.|baidu\.|bing\.|fulltextSearch|\/search(?:[/?#]|$)|[?&](?:q|query|keyword)=)/i.test(url);
}

export function publicSourceLabel(source: DealSource) {
  if (source.link_status === "not_publicly_available" || !source.url) return "Wind公告库，公开链接未取得";
  return source.title;
}
