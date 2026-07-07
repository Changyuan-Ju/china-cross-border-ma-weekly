import { ExternalLink } from "lucide-react";
import type { DealSource } from "@/lib/types";

export function SourceLink({ source }: { source?: DealSource | null }) {
  if (!source) return null;
  const canOpen = Boolean(source.url && source.link_status !== "not_publicly_available" && source.link_status !== "broken" && source.link_status !== "inaccessible");
  if (!canOpen) {
    return <span className="inline-flex border border-line bg-paper px-4 py-2 text-sm text-muted">Wind公告库，公开链接未取得</span>;
  }
  return (
    <a className="focus-ring inline-flex items-center gap-2 border border-line bg-paper px-4 py-2 text-sm text-ink hover:border-gold hover:text-ink" href={source.url} target="_blank" rel="noreferrer">
      公告来源 <ExternalLink size={14} />
    </a>
  );
}
