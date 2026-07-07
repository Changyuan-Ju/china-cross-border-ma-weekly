import type { WeeklyPayload } from "../types";
import { detailExtractionRules, detailProfileFields } from "./deal-detail-policy";

export type WindAdapterOptions = {
  from: string;
  to: string;
};

export async function collectFromWind(_options: WindAdapterOptions): Promise<WeeklyPayload> {
  throw new Error(
    `Wind adapter is configured as a local-only integration point for ${_options.from} to ${_options.to}. Use LOCAL_JSON_PATH for tests, or implement this adapter against the local Wind MCP/CLI in the Codex environment. Future Wind extraction must populate optional detail profile fields: ${detailProfileFields.join(", ")}. Rules: ${detailExtractionRules.join(" ")}`
  );
}
