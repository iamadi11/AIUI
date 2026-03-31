import type { Action } from "@aiui/dsl-schema";

/** Single-step actions that can appear in the visual list or as `condition` branches. */
export function isBranchAction(
  a: Action,
): a is Extract<
  Action,
  | { type: "setState" }
  | { type: "navigate" }
  | { type: "http" }
  | { type: "fetch" }
  | { type: "transform" }
  | { type: "modal" }
  | { type: "notify" }
> {
  return (
    a.type === "setState" ||
    a.type === "navigate" ||
    a.type === "http" ||
    a.type === "fetch" ||
    a.type === "transform" ||
    a.type === "modal" ||
    a.type === "notify"
  );
}

/**
 * Actions editable in the visual (non-JSON) list: branch actions, or one-level
 * `condition` whose `then` / optional `else` are branch actions only.
 */
export function isSimpleAction(a: Action): boolean {
  if (isBranchAction(a)) return true;
  if (a.type === "condition") {
    return (
      isBranchAction(a.then) &&
      (a.else === undefined || isBranchAction(a.else))
    );
  }
  return false;
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

/** Serialize HTTP body for a textarea (objects → JSON). */
export function formatHttpBodyInput(body: unknown): string {
  if (body === undefined) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
}

export function parseHttpBodyInput(raw: string): unknown | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return raw;
  }
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

export function defaultBranchAction(
  t:
    | "setState"
    | "navigate"
    | "http"
    | "fetch"
    | "transform"
    | "modal"
    | "notify",
): Extract<
  Action,
  | { type: "setState" }
  | { type: "navigate" }
  | { type: "http" }
  | { type: "fetch" }
  | { type: "transform" }
  | { type: "modal" }
  | { type: "notify" }
> {
  if (t === "setState") return { type: "setState", path: "key", value: "" };
  if (t === "navigate") return { type: "navigate", href: "/" };
  if (t === "fetch") return { type: "fetch", method: "GET", url: "https://" };
  if (t === "transform") return { type: "transform", path: "key", expression: "true" };
  if (t === "modal") return { type: "modal", action: "open", target: "modal-id" };
  if (t === "notify") return { type: "notify", level: "info", message: "Done" };
  return { type: "http", method: "GET", url: "https://" };
}

export function defaultConditionAction(): Action {
  return {
    type: "condition",
    when: "true",
    then: { type: "setState", path: "count", value: 0 },
  };
}
