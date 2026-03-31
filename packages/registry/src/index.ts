import type { UiNode } from "@aiui/dsl-schema";

export const BOX_TYPE = "Box";
export const STACK_TYPE = "Stack";

/** Builder palette grouping (ordered left-to-right in the UI). */
export type PaletteCategory =
  | "layout"
  | "input"
  | "data"
  | "display"
  | "advanced";

export const PALETTE_CATEGORY_ORDER: readonly PaletteCategory[] = [
  "layout",
  "input",
  "data",
  "display",
  "advanced",
] as const;

export const PALETTE_CATEGORY_LABELS: Record<PaletteCategory, string> = {
  layout: "Layout",
  input: "Input",
  data: "Data",
  display: "Display",
  advanced: "Advanced",
};

/** Where the field writes: node `props` (default) or `layout` (layout engine). */
export type InspectorFieldScope = "props" | "layout";

export type InspectorField =
  | {
      kind: "select";
      key: string;
      label: string;
      options: readonly { value: string; label: string }[];
      scope?: InspectorFieldScope;
    }
  | {
      kind: "number";
      key: string;
      label: string;
      min?: number;
      step?: number;
      scope?: InspectorFieldScope;
    }
  | {
      /** Writes `node.layout.margin` as `{ top, right, bottom, left }` (or clears when all zero). */
      kind: "marginSides";
      key: "margin";
      label: string;
      min?: number;
      step?: number;
      scope?: InspectorFieldScope;
    }
  | {
      kind: "text";
      key: string;
      label: string;
      placeholder?: string;
      scope?: InspectorFieldScope;
    };

export type ComponentDefinition = {
  type: string;
  displayName: string;
  defaultProps: Record<string, unknown>;
  /** Builder palette section. */
  paletteCategory: PaletteCategory;
  /** Extra tokens for palette search (lowercased when matching). */
  paletteKeywords?: readonly string[];
  /** One-line builder hint under the display name. */
  paletteDescription?: string;
  /** Optional tree fragment inserted when dropping this type on the canvas. */
  defaultChildren?: UiNode[];
  /** Builder-only hints for the properties panel (not serialized separately). */
  inspectorFields?: readonly InspectorField[];
};

export const primitives: Record<string, ComponentDefinition> = {
  [BOX_TYPE]: {
    type: BOX_TYPE,
    displayName: "Box",
    paletteCategory: "layout",
    paletteKeywords: ["box", "container", "group", "frame", "div"],
    paletteDescription: "Simple container",
    defaultProps: { label: "" },
    inspectorFields: [
      {
        kind: "text",
        key: "label",
        label: "Label",
        placeholder: "Name this layer…",
      },
      {
        kind: "number",
        key: "padding",
        label: "Padding (px)",
        min: 0,
        step: 1,
        scope: "layout",
      },
      {
        kind: "marginSides",
        key: "margin",
        label: "Margin (px)",
        min: 0,
        step: 1,
        scope: "layout",
      },
      {
        kind: "number",
        key: "width",
        label: "Width (px, empty leaf)",
        min: 0,
        step: 1,
        scope: "layout",
      },
      {
        kind: "number",
        key: "height",
        label: "Height (px, empty leaf)",
        min: 0,
        step: 1,
        scope: "layout",
      },
    ],
  },
  [STACK_TYPE]: {
    type: STACK_TYPE,
    displayName: "Stack",
    paletteCategory: "layout",
    paletteKeywords: [
      "stack",
      "flex",
      "row",
      "column",
      "gap",
      "layout",
      "list",
    ],
    paletteDescription: "Row or column with gap",
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
      {
        kind: "number",
        key: "padding",
        label: "Padding (px)",
        min: 0,
        step: 1,
        scope: "layout",
      },
      {
        kind: "marginSides",
        key: "margin",
        label: "Margin (px)",
        min: 0,
        step: 1,
        scope: "layout",
      },
      {
        kind: "number",
        key: "width",
        label: "Width (px, empty leaf)",
        min: 0,
        step: 1,
        scope: "layout",
      },
      {
        kind: "number",
        key: "height",
        label: "Height (px, empty leaf)",
        min: 0,
        step: 1,
        scope: "layout",
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

/** All registered primitives in stable palette order (category, then name). */
export function listPaletteDefinitions(): ComponentDefinition[] {
  return Object.values(primitives).sort((a, b) => {
    const ca = PALETTE_CATEGORY_ORDER.indexOf(a.paletteCategory);
    const cb = PALETTE_CATEGORY_ORDER.indexOf(b.paletteCategory);
    if (ca !== cb) return ca - cb;
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Whether `def` matches a palette search string. Tokens (whitespace-separated)
 * must all appear somewhere in display name, type, or keywords.
 */
export function matchesPaletteSearch(
  def: ComponentDefinition,
  query: string,
): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  const tokens = raw.split(/\s+/).filter(Boolean);
  const hay = [
    def.displayName,
    def.type,
    ...(def.paletteKeywords ?? []),
    def.paletteDescription ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}
