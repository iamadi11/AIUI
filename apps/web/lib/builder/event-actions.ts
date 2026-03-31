import type { Action } from "@aiui/dsl-schema";

/** Top-level actions editable in the simple (non-JSON) UI. */
export function isSimpleAction(a: Action): boolean {
  return a.type === "setState" || a.type === "navigate" || a.type === "http";
}

export function isSimpleActionsList(actions: Action[]): boolean {
  return actions.every(isSimpleAction);
}

export function parseValueInput(raw: string): unknown {
  const t = raw.trim();
  if (t === "") return "";
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return raw;
  }
}

export function formatValueForInput(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export const COMMON_EVENT_NAMES = [
  "click",
  "submit",
  "change",
  "input",
  "focus",
  "blur",
  "keydown",
] as const;

export function defaultSimpleActions(): Action[] {
  return [{ type: "setState", path: "count", value: 0 }];
}
