import { hashString } from "./hash.js";

function stableId(path: string[]): string {
  return hashString(path.join("."));
}

export function parseInput(input: unknown): unknown {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as unknown;
    } catch {
      return input;
    }
  }
  return input;
}

export function normalizeRootValue(value: unknown): unknown {
  const v = parseInput(value);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if ("data" in o && o.data !== undefined) return o.data;
  }
  return v;
}

export { stableId };
