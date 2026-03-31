import { isUnsafePathSegment } from "@aiui/expression";

/**
 * Immutable dot-path write into a plain object tree (for document `state`).
 * Rejects unsafe path segments (same policy as `@aiui/expression`).
 */
export function setPathImmutable(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) {
    throw new Error("Invalid path");
  }
  for (const seg of segments) {
    if (isUnsafePathSegment(seg)) {
      throw new Error(`Invalid path segment: ${seg}`);
    }
  }
  const next = structuredClone(root) as Record<string, unknown>;
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < segments.length - 1; i++) {
    const k = segments[i]!;
    const child = cur[k];
    const childObj =
      typeof child === "object" && child !== null && !Array.isArray(child)
        ? (structuredClone(child) as Record<string, unknown>)
        : {};
    cur[k] = childObj;
    cur = childObj;
  }
  cur[segments[segments.length - 1]!] = value;
  return next;
}
