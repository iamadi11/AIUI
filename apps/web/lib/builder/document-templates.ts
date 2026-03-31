import type { UiNode } from "@aiui/dsl-schema";
import { BOX_TYPE, STACK_TYPE } from "@aiui/registry";
import { createNodeFromType } from "@/lib/document/model";

/** Horizontal stack with two empty boxes (gap 8px). */
export function createRowWithTwoBoxes(): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  const b1 = createNodeFromType(BOX_TYPE);
  const b2 = createNodeFromType(BOX_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction: "row", gap: 8 },
    children: [b1, b2],
  };
}

export const BUILDER_DOCUMENT_TEMPLATES = [
  {
    id: "row-two-boxes",
    label: "Row + two boxes",
    description: "Stack (row) with two Box children",
    create: createRowWithTwoBoxes,
  },
] as const;
