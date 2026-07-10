export function dedupeTags(tags: Array<string | null | undefined>, excluded: string[] = []) {
  const blocked = new Set(excluded.map(tagKey).filter(Boolean));
  const seen = new Set<string>();

  return tags.reduce<string[]>((result, value) => {
    const label = cleanTag(value);
    const key = tagKey(label);
    if (!label || !key || blocked.has(key) || seen.has(key)) return result;
    seen.add(key);
    result.push(label);
    return result;
  }, []);
}

export function paymentMethodTag(method: string) {
  const label = cleanTag(method);
  return label.endsWith("支付") ? label : `${label}支付`;
}

function cleanTag(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function tagKey(value: string | null | undefined) {
  return cleanTag(value).toLowerCase();
}
