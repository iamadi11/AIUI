import type { UiNode } from "@aiui/dsl-schema";
import { parseBoxSides } from "./box-sides";

export type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const ZERO: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

/** Reads `node.layout.padding`: number (all sides) or partial `{ top, right, bottom, left }`. */
export function parsePadding(node: UiNode): Padding {
  return parseBoxSides({ value: node.layout?.padding, fallback: ZERO });
}
