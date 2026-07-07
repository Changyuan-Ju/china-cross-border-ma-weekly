import type { DealSource } from "./types";

export function normalizeSource(source: DealSource): DealSource {
  return {
    ...source,
    title: source.title.trim(),
    url: source.url.trim()
  };
}

export function validateSources(sources: DealSource[]) {
  const errors: string[] = [];
  for (const source of sources) {
    try {
      const url = new URL(source.url);
      if (!["http:", "https:"].includes(url.protocol)) errors.push(`unsupported_source_protocol:${source.url}`);
    } catch {
      errors.push(`invalid_source_url:${source.url}`);
    }
  }
  return errors;
}
