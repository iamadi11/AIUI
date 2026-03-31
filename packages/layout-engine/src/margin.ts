import type { UiNode } from "@aiui/dsl-schema";

export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const ZERO: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

/** Reads `node.layout.margin`: number (all sides) or partial `{ top, right, bottom, left }`. */
export function parseMargin(node: UiNode): Margin {
  const raw = node.layout?.margin as unknown;
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
