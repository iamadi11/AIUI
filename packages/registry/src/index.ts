import type { UiNode } from "@aiui/dsl-schema";

export const BOX_TYPE = "Box";
export const STACK_TYPE = "Stack";

export type ComponentDefinition = {
  type: string;
  displayName: string;
  defaultProps: Record<string, unknown>;
  /** Optional tree fragment inserted when dropping this type on the canvas. */
  defaultChildren?: UiNode[];
};

export const primitives: Record<string, ComponentDefinition> = {
  [BOX_TYPE]: {
    type: BOX_TYPE,
    displayName: "Box",
    defaultProps: {},
  },
  [STACK_TYPE]: {
    type: STACK_TYPE,
    displayName: "Stack",
    defaultProps: { direction: "column" as const, gap: 0 },
  },
};

export function isRegisteredType(type: string): boolean {
  return type in primitives;
}

export function getDefinition(type: string): ComponentDefinition | undefined {
  return primitives[type];
}
