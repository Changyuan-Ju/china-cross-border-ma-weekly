import { readFile } from "node:fs/promises";
import path from "node:path";
import { weeklyPayloadSchema } from "../schema";
import type { WeeklyPayload } from "../types";

export async function loadWeeklyPayloadFromJson(filePath: string): Promise<WeeklyPayload> {
  const absolute = path.resolve(process.cwd(), filePath);
  const payload = JSON.parse(await readFile(absolute, "utf8"));
  return weeklyPayloadSchema.parse(payload);
}
