import type { Deal } from "./types";

export function rankDeals(deals: Deal[]) {
  return [...deals].sort((a, b) => {
    const priorityA = a.manual_priority ?? 999;
    const priorityB = b.manual_priority ?? 999;
    if (priorityA !== priorityB) return priorityA - priorityB;
    if (a.importance_score !== b.importance_score) return b.importance_score - a.importance_score;
    return new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime();
  });
}
