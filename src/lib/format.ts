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
