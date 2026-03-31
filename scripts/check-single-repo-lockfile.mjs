#!/usr/bin/env node
/**
 * Fails if a nested pnpm lockfile or workspace file exists under apps/, packages/,
 * or examples/. The repo must use a single root `pnpm-lock.yaml` and one root
 * `pnpm-workspace.yaml` so `workspace:*` resolves correctly.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  ".turbo",
]);

const violations = [];

function walk(dir, rel) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
      continue;
    }
    if (e.name !== "pnpm-lock.yaml" && e.name !== "pnpm-workspace.yaml") continue;
    const pathRel = rel ? `${rel}/${e.name}` : e.name;
    if (pathRel !== "pnpm-lock.yaml" && pathRel !== "pnpm-workspace.yaml") {
      violations.push(pathRel);
    }
  }
}

walk(root, "");

if (violations.length > 0) {
  console.error(
    "Nested pnpm lockfile/workspace files are not allowed (breaks workspace:*):\n",
  );
  for (const v of violations.sort()) console.error(`  - ${v}`);
  console.error(
    "\nUse the root pnpm-lock.yaml only; delete apps/<app>/pnpm-lock.yaml and nested pnpm-workspace.yaml if present.",
  );
  process.exit(1);
}
