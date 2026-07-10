import { format } from "date-fns";

export function fmtDate(value: string | Date) {
  return format(new Date(value), "yyyy-MM-dd");
}

export function fmtIssueRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日 - ${e.getMonth() + 1}月${e.getDate()}日`;
}

export function fmtMoney(amount?: number | null, currency?: string | null, text?: string | null) {
  if (text) return text;
  if (!amount || !currency) return "未披露";
  return `${currency} ${amount.toLocaleString("zh-CN")}`;
}

export function buildIssueSummary(includedCount: number, reviewRequiredCount: number) {
  const reviewText = reviewRequiredCount ? `，另有 ${reviewRequiredCount} 笔待复核` : "";
  return `本期正式纳入 ${includedCount} 笔中资企业跨境并购交易${reviewText}。`;
}

export function fmtIssueSummary(summary: string | null | undefined, includedCount: number, reviewRequiredCount: number) {
  if (summary && !/^Included \d+ deal\(s\);/i.test(summary.trim())) return summary;
  return buildIssueSummary(includedCount, reviewRequiredCount);
}

export function announcementTypeLabel(type: string) {
  return type === "initial" ? "首次披露" : type === "update" ? "进展公告" : type;
}

export function validationLabel(status: string) {
  const labels: Record<string, string> = { valid: "已核验", review_required: "待复核", rejected: "已排除" };
  return labels[status] ?? status;
}

export function sourceTypeLabel(type: string) {
  const labels: Record<string, string> = { wind_record: "Wind公告记录", exchange_filing: "交易所公告", company_announcement: "公司公告" };
  return labels[type] ?? type;
}

export function linkStatusLabel(status: string) {
  const labels: Record<string, string> = {
    valid: "链接有效",
    broken: "链接失效",
    replaced: "链接已替换",
    inaccessible: "暂不可访问",
    not_publicly_available: "未取得公开链接"
  };
  return labels[status] ?? status;
}

export function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    proposed: "提出交易",
    agreement_signed: "已签署协议",
    board_approved: "董事会批准",
    shareholder_approved: "股东批准",
    regulatory_review: "监管审批中",
    conditions_pending: "交割条件尚未满足",
    conditions_satisfied: "主要交割条件已满足",
    extended: "延长期限",
    terms_amended: "条款调整",
    partially_completed: "部分完成",
    completed: "完成交割",
    terminated: "终止交易",
    lapsed: "协议失效",
    unknown: "未明确"
  };
  return labels[stage] ?? stage;
}
