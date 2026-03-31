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

/** Vertical stack with header, content, footer boxes. */
export function createHeaderContentFooter(): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  const header = createNodeFromType(BOX_TYPE);
  const content = createNodeFromType(BOX_TYPE);
  const footer = createNodeFromType(BOX_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction: "column", gap: 8 },
    children: [header, content, footer],
  };
}

/** Sidebar + content layout: row stack with narrow sidebar and flexible content. */
export function createSidebarAndContent(): UiNode {
  const stack = createNodeFromType(STACK_TYPE);
  const sidebar = createNodeFromType(BOX_TYPE);
  const content = createNodeFromType(BOX_TYPE);
  return {
    ...stack,
    props: { ...stack.props, direction: "row", gap: 8 },
    children: [
      {
        ...sidebar,
        layout: { ...(sidebar.layout ?? {}), width: 240 },
      },
      content,
    ],
  };
}

export const BUILDER_DOCUMENT_TEMPLATES = [
  {
    id: "row-two-boxes",
    label: "Row + two boxes",
    description: "Stack (row) with two Box children",
    create: createRowWithTwoBoxes,
  },
  {
    id: "header-content-footer",
    label: "Header / content / footer",
    description: "Vertical Stack with three Box rows",
    create: createHeaderContentFooter,
  },
  {
    id: "sidebar-and-content",
    label: "Sidebar + content",
    description: "Row Stack with fixed-width sidebar Box and flexible content Box",
    create: createSidebarAndContent,
  },
] as const;
