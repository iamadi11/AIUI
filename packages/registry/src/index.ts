import type { UiNode } from "@aiui/dsl-schema";

export const BOX_TYPE = "Box";
export const STACK_TYPE = "Stack";

export type InspectorField =
  | {
      kind: "select";
      key: string;
      label: string;
      options: readonly { value: string; label: string }[];
    }
  | {
      kind: "number";
      key: string;
      label: string;
      min?: number;
      step?: number;
    }
  | {
      kind: "text";
      key: string;
      label: string;
      placeholder?: string;
    };

export type ComponentDefinition = {
  type: string;
  displayName: string;
  defaultProps: Record<string, unknown>;
  /** Optional tree fragment inserted when dropping this type on the canvas. */
  defaultChildren?: UiNode[];
  /** Builder-only hints for the properties panel (not serialized separately). */
  inspectorFields?: readonly InspectorField[];
};

export const primitives: Record<string, ComponentDefinition> = {
  [BOX_TYPE]: {
    type: BOX_TYPE,
    displayName: "Box",
    defaultProps: { label: "" },
    inspectorFields: [
      {
        kind: "text",
        key: "label",
        label: "Label",
        placeholder: "Name this layer…",
      },
    ],
  },
  [STACK_TYPE]: {
    type: STACK_TYPE,
    displayName: "Stack",
    defaultProps: { direction: "column" as const, gap: 0, label: "" },
    inspectorFields: [
      {
        kind: "text",
        key: "label",
        label: "Label",
        placeholder: "Name this layer…",
      },
      {
        kind: "select",
        key: "direction",
        label: "Direction",
        options: [
          { value: "column", label: "Column" },
          { value: "row", label: "Row" },
        ],
      },
      {
        kind: "number",
        key: "gap",
        label: "Gap (px)",
        min: 0,
        step: 1,
      },
    ],
  },
};

export function isRegisteredType(type: string): boolean {
  return type in primitives;
}

export function getDefinition(type: string): ComponentDefinition | undefined {
  return primitives[type];
}

export function getInspectorFields(
  type: string,
): readonly InspectorField[] | undefined {
  return getDefinition(type)?.inspectorFields;
}
