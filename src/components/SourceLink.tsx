import { ExternalLink } from "lucide-react";
import type { DealSource } from "@/lib/types";

export function sourceCanOpen(source?: DealSource | null) {
  return Boolean(source?.url && source.link_status !== "not_publicly_available" && source.link_status !== "broken" && source.link_status !== "inaccessible");
}

export function sourcesForButtons(sources: DealSource[]) {
  const unique = Array.from(new Map(sources.map((source) => [source.url.trim().toLowerCase() || `${source.title}|${source.published_at ?? ""}`, source])).values());
  const openable = unique.filter(sourceCanOpen);
  return openable.length ? openable : unique.slice(0, 1);
}

export function preferredSource(sources: DealSource[]) {
  return sourcesForButtons(sources)[0];
}

export function SourceLink({ source, hideUnavailable = false }: { source?: DealSource | null; hideUnavailable?: boolean }) {
  if (!source) return null;
  const canOpen = sourceCanOpen(source);
  if (!canOpen) {
    if (hideUnavailable) return null;
    return <span className="inline-flex border border-line bg-paper px-4 py-2 text-sm text-muted">未取得公开链接</span>;
  }
  return (
    <a className="focus-ring inline-flex items-center gap-2 border border-line bg-paper px-4 py-2 text-sm text-ink hover:border-gold hover:text-ink" href={source.url} target="_blank" rel="noreferrer">
      公告来源 <ExternalLink size={14} />
    </a>
  );
}
