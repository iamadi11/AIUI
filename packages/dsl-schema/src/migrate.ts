import { DSL_VERSION, LAYOUT_VERSION } from "./versions";

/**
 * Reserved for version-specific transforms (semver → migration function).
 * Empty until we ship a second incompatible DSL version.
 */
export const MIGRATION_REGISTRY: Record<
  string,
  (raw: Record<string, unknown>) => Record<string, unknown>
> = {};

function deepCloneJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Best-effort normalization before `safeParseDocument` (missing `layoutVersion`,
 * empty `version`, etc.). Does not repair invalid trees.
 */
export function migrateDocument(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const data = deepCloneJson(raw) as Record<string, unknown>;
  if (typeof data.version !== "string" || data.version.trim() === "") {
    data.version = DSL_VERSION;
  }
  if (data.layoutVersion === undefined && data.root !== undefined) {
    data.layoutVersion = LAYOUT_VERSION;
  }
  if (
    data.layoutVersion !== undefined &&
    typeof data.layoutVersion !== "string"
  ) {
    data.layoutVersion = String(data.layoutVersion);
  }
  return data;
}
