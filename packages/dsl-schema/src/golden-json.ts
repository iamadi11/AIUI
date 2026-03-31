import type { AiuiDocument } from "./document";
import {
  safeParseDocument,
  safeParseDocumentWithMigration,
} from "./document";
import { migrateDocument } from "./migrate";
import { DSL_VERSION, LAYOUT_VERSION } from "./versions";

export type GoldenJsonResult =
  | { ok: true; json: string; document: AiuiDocument }
  | { ok: false; message: string };

export type GoldenJsonImportAssistantResult =
  | {
      ok: true;
      requiresMigration: boolean;
      originalVersion: string | null;
      migratedVersion: string;
      warnings: string[];
      json: string;
      document: AiuiDocument;
    }
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

/** Parse a JSON file/string, migrate older shapes, then validate as `AiuiDocument`. */
export function importGoldenJson(text: string): GoldenJsonResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "Input is not valid JSON." };
  }
  const r = safeParseDocumentWithMigration(raw);
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

/**
 * Import helper for migration-assistant UX. It reports whether migration was
 * needed and provides user-facing warnings for older or partial documents.
 */
export function inspectGoldenJsonImport(
  text: string,
): GoldenJsonImportAssistantResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "Input is not valid JSON." };
  }
  const original =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  const originalVersion =
    original && typeof original.version === "string" && original.version.trim()
      ? original.version.trim()
      : null;

  const migrated = migrateDocument(raw);
  const parsed = safeParseDocument(migrated);
  if (!parsed.success) {
    return {
      ok: false,
      message: JSON.stringify(parsed.error.flatten(), null, 2),
    };
  }

  const warnings: string[] = [];
  if (originalVersion && originalVersion !== DSL_VERSION) {
    warnings.push(
      `Document DSL version ${originalVersion} will be upgraded to ${DSL_VERSION}.`,
    );
  } else if (!originalVersion) {
    warnings.push(
      `Document did not include a DSL version; defaulting to ${DSL_VERSION}.`,
    );
  }
  if (original && original.layoutVersion === undefined) {
    warnings.push(
      `Document did not include layoutVersion; defaulting to ${LAYOUT_VERSION}.`,
    );
  }

  return {
    ok: true,
    requiresMigration:
      warnings.length > 0 || parsed.data.version !== (originalVersion ?? DSL_VERSION),
    originalVersion,
    migratedVersion: parsed.data.version,
    warnings,
    json: JSON.stringify(parsed.data, null, 2),
    document: parsed.data,
  };
}
