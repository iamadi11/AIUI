import { DSL_VERSION, LAYOUT_VERSION } from "./versions";

export type MigrationFn = (
  raw: Record<string, unknown>,
) => Record<string, unknown>;

/**
 * One step per **source** `version` string. Each function must set `version` to
 * the next format (usually the current `DSL_VERSION` after the last hop).
 * `migrateDocument` applies these in a loop until `version === DSL_VERSION` or
 * no migrator exists (unknown / future version — left unchanged; parse may fail).
 */
export const MIGRATION_REGISTRY: Record<string, MigrationFn> = {
  "0.1.0": migrate_0_1_0_to_0_2_0,
  "0.2.0": migrate_0_2_0_to_0_3_0,
};

function migrate_0_1_0_to_0_2_0(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  // 0.2.0: migration chain in place; add breaking transforms here when the
  // schema shape changes (rename fields, wrap nodes, etc.).
  raw.version = "0.2.0";
  return raw;
}

function migrate_0_2_0_to_0_3_0(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  if (
    raw.screens &&
    typeof raw.screens === "object" &&
    !Array.isArray(raw.screens)
  ) {
    raw.version = "0.3.0";
    return raw;
  }
  const root = raw.root;
  if (!root || typeof root !== "object") {
    raw.version = "0.3.0";
    return raw;
  }
  raw.screens = {
    default: { title: "Screen", root },
  };
  raw.initialScreenId = "default";
  raw.flowLayout = {
    positions: { default: { x: 0, y: 0 } },
    edges: [],
  };
  delete raw.root;
  raw.version = "0.3.0";
  return raw;
}

function deepCloneJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const MIGRATION_MAX_STEPS = 32;

function applyVersionMigrations(data: Record<string, unknown>): void {
  for (let step = 0; step < MIGRATION_MAX_STEPS; step++) {
    const v =
      typeof data.version === "string" ? data.version.trim() : "";
    if (v === DSL_VERSION) return;
    const migrator = MIGRATION_REGISTRY[v];
    if (!migrator) return;
    migrator(data);
  }
}

/**
 * Best-effort normalization before `safeParseDocument` (missing `layoutVersion`,
 * empty `version`, etc.). Applies `MIGRATION_REGISTRY` until `version` matches
 * `DSL_VERSION` when a migrator exists. Does not repair invalid trees.
 */
export function migrateDocument(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const data = deepCloneJson(raw) as Record<string, unknown>;
  if (typeof data.version !== "string" || data.version.trim() === "") {
    data.version = DSL_VERSION;
  } else {
    data.version = data.version.trim();
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
  applyVersionMigrations(data);
  normalizeLegacyRootToScreens(data);
  return data;
}

/** If `screens` is missing but `root` exists, wrap into a single default screen. */
function normalizeLegacyRootToScreens(data: Record<string, unknown>): void {
  if (
    data.screens &&
    typeof data.screens === "object" &&
    !Array.isArray(data.screens)
  ) {
    return;
  }
  const root = data.root;
  if (!root || typeof root !== "object") return;
  data.screens = {
    default: { title: "Screen", root },
  };
  data.initialScreenId = "default";
  if (data.flowLayout === undefined) {
    data.flowLayout = {
      positions: { default: { x: 0, y: 0 } },
      edges: [],
    };
  }
  delete data.root;
}
