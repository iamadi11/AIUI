import type { UiNode } from "@aiui/dsl-schema";
import { parseBoxSides } from "./box-sides";

export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const ZERO: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

/** Reads `node.layout.margin`: number (all sides) or partial `{ top, right, bottom, left }`. */
export function parseMargin(node: UiNode): Margin {
  return parseBoxSides({ value: node.layout?.margin as unknown, fallback: ZERO });
}
