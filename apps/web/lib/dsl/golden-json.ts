import type { AiuiDocument } from "@aiui/dsl-schema";
import { safeParseDocument } from "@aiui/dsl-schema";

export type GoldenJsonResult =
  | { ok: true; json: string; document: AiuiDocument }
  | { ok: false; message: string };

/**
 * Produce pretty-printed JSON that is guaranteed to satisfy `documentSchema`
 * (same bytes round-trip through `JSON.parse` + `parseDocument`).
 */
export function exportGoldenJson(doc: AiuiDocument): GoldenJsonResult {
  const r = safeParseDocument(doc);
  if (!r.success) {
    return {
      ok: false,
      message: JSON.stringify(r.error.flatten(), null, 2),
    };
  }
  return {
    ok: true,
    json: JSON.stringify(r.data, null, 2),
    document: r.data,
  };
}

/** Parse a JSON file/string and validate as `AiuiDocument`. */
export function importGoldenJson(text: string): GoldenJsonResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "Input is not valid JSON." };
  }
  const r = safeParseDocument(raw);
  if (!r.success) {
    return {
      ok: false,
      message: JSON.stringify(r.error.flatten(), null, 2),
    };
  }
  return {
    ok: true,
    json: JSON.stringify(r.data, null, 2),
    document: r.data,
  };
}
