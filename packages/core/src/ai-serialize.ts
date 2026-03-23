import type { AIInferenceRequestPayload, DataNode } from "./types.js";
import { generateSchemaSignature, schemaTreeForAI } from "./signature.js";
import type { ComponentCandidate } from "./types.js";

export const AVAILABLE_COMPONENT_IDS = [
  "DataTable",
  "KeyValueList",
  "BarChart",
  "TagList",
  "BulletList",
  "TreePanel",
  "MetricGrid",
  "PropertyCard",
  "CardGrid",
  "LineChart",
  "JsonFallback",
  "DashboardShell",
] as const;

export function buildAIInferencePayload(
  root: DataNode,
  ruleCandidates: ComponentCandidate[],
): AIInferenceRequestPayload {
  return {
    schemaSignature: generateSchemaSignature(root),
    schemaTree: schemaTreeForAI(root),
    availableComponents: [...AVAILABLE_COMPONENT_IDS],
    ruleCandidates: ruleCandidates.map((c) => ({
      componentId: c.componentId,
      score: c.score,
      ruleId: c.ruleId,
      configDefaults: c.configDefaults,
    })),
  };
}

/**
 * Ensures no user-provided scalar values from `data` appear in the JSON payload.
 * Used in tests and optionally in dev assertions.
 */
export function payloadExcludesDataValues(
  payload: AIInferenceRequestPayload,
  data: unknown,
): boolean {
  const secrets = collectScalarStrings(data);
  const json = JSON.stringify(payload);
  for (const s of secrets) {
    if (s.length < 3) continue;
    if (json.includes(s)) return false;
  }
  return true;
}

function collectScalarStrings(v: unknown, out: Set<string> = new Set()): string[] {
  if (v === null || v === undefined) return [...out];
  if (typeof v === "string") {
    out.add(v);
    return [...out];
  }
  if (typeof v === "number" || typeof v === "boolean") {
    out.add(String(v));
    return [...out];
  }
  if (Array.isArray(v)) {
    for (const item of v) collectScalarStrings(item, out);
    return [...out];
  }
  if (typeof v === "object") {
    for (const k of Object.keys(v as object)) {
      collectScalarStrings((v as Record<string, unknown>)[k], out);
    }
  }
  return [...out];
}
