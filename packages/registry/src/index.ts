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

/** Beginner-first ordering for inspector sections. */
export type InspectorSectionId =
  | "content"
  | "data"
  | "actions"
  | "visibility"
  | "layout"
  | "style"
  | "accessibility"
  | "advanced";

export const INSPECTOR_SECTION_ORDER: readonly InspectorSectionId[] = [
  "content",
  "data",
  "actions",
  "visibility",
  "layout",
  "style",
  "accessibility",
  "advanced",
] as const;

export const INSPECTOR_SECTION_LABELS: Record<InspectorSectionId, string> = {
  content: "Content",
  data: "Data",
  actions: "Actions",
  visibility: "Visibility",
  layout: "Layout",
  style: "Style",
  accessibility: "Accessibility",
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

export type ComponentCapabilities = {
  supportsDataSource?: boolean;
  supportsActions?: boolean;
  supportsRowActions?: boolean;
  supportsVisibilityRules?: boolean;
  supportedLayoutModes?: readonly ("flow" | "stack" | "grid" | "absolute")[];
};

/**
 * Standardized builder UX metadata. This keeps palette/search/inspector behavior
 * on one explicit contract instead of spread across ad-hoc top-level fields.
 */
export type ComponentUxMetadata = {
  palette: {
    category: PaletteCategory;
    keywords?: readonly string[];
    description?: string;
  };
  inspector?: {
    fields: readonly InspectorField[];
    defaultSection?: InspectorSectionId;
    sectionOrder?: readonly InspectorSectionId[];
  };
  capabilities?: ComponentCapabilities;
};

export type ComponentDefinition = {
  type: string;
  displayName: string;
  defaultProps: Record<string, unknown>;
  /** Builder UX metadata contract (palette + inspector + capabilities). */
  ux: ComponentUxMetadata;
  /** Optional tree fragment inserted when dropping this type on the canvas. */
  defaultChildren?: UiNode[];
};

export const primitives: Record<string, ComponentDefinition> = {
  [BOX_TYPE]: {
    type: BOX_TYPE,
    displayName: "Box",
    defaultProps: { label: "" },
    ux: {
      palette: {
        category: "layout",
        keywords: ["box", "container", "group", "frame", "div"],
        description: "Simple container",
      },
      capabilities: {
        supportsActions: true,
        supportsVisibilityRules: true,
        supportedLayoutModes: ["flow", "stack", "grid", "absolute"],
      },
      inspector: {
        defaultSection: "content",
        sectionOrder: INSPECTOR_SECTION_ORDER,
        fields: [
          {
            kind: "text",
            key: "label",
            label: "Label",
            placeholder: "Name this layer...",
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
    },
  },
  [STACK_TYPE]: {
    type: STACK_TYPE,
    displayName: "Stack",
    defaultProps: { direction: "column" as const, gap: 0, label: "" },
    ux: {
      palette: {
        category: "layout",
        keywords: ["stack", "flex", "row", "column", "gap", "layout", "list"],
        description: "Row or column with gap",
      },
      capabilities: {
        supportsActions: true,
        supportsVisibilityRules: true,
        supportedLayoutModes: ["flow", "stack", "grid"],
      },
      inspector: {
        defaultSection: "content",
        sectionOrder: INSPECTOR_SECTION_ORDER,
        fields: [
          {
            kind: "text",
            key: "label",
            label: "Label",
            placeholder: "Name this layer...",
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
    },
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
  return getDefinition(type)?.ux.inspector?.fields;
}

export function getCapabilities(type: string) {
  return getDefinition(type)?.ux.capabilities;
}

export function getPaletteMeta(type: string) {
  return getDefinition(type)?.ux.palette;
}

/** All registered primitives in stable palette order (category, then name). */
export function listPaletteDefinitions(): ComponentDefinition[] {
  return Object.values(primitives).sort((a, b) => {
    const ca = PALETTE_CATEGORY_ORDER.indexOf(a.ux.palette.category);
    const cb = PALETTE_CATEGORY_ORDER.indexOf(b.ux.palette.category);
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
    ...(def.ux.palette.keywords ?? []),
    def.ux.palette.description ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}
