export type TextCorruptionFinding = {
  path: Array<string | number>;
  kind: "unicode_replacement_character";
};

export function findTextCorruption(value: unknown, path: Array<string | number> = []): TextCorruptionFinding[] {
  if (typeof value === "string") {
    return value.includes("�") ? [{ path, kind: "unicode_replacement_character" }] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => findTextCorruption(item, [...path, index]));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => findTextCorruption(item, [...path, key]));
  }
  return [];
}
