import type { UiNode } from "@aiui/dsl-schema";

export type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const ZERO: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

/** Reads `node.layout.padding`: number (all sides) or partial `{ top, right, bottom, left }`. */
export function parsePadding(node: UiNode): Padding {
  const raw = node.layout?.padding;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const v = Math.max(0, raw);
    return { top: v, right: v, bottom: v, left: v };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      top: Math.max(0, Number(o.top) || 0),
      right: Math.max(0, Number(o.right) || 0),
      bottom: Math.max(0, Number(o.bottom) || 0),
      left: Math.max(0, Number(o.left) || 0),
    };
  }
  return ZERO;
}
