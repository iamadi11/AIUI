import type { UiNode } from "@aiui/dsl-schema";

export const BOX_TYPE = "Box";
export const STACK_TYPE = "Stack";
export const BUTTON_TYPE = "Button";
export const INPUT_TYPE = "Input";
export const CARD_TYPE = "Card";
export const TABLE_TYPE = "Table";
export const BADGE_TYPE = "Badge";

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

/** Quick-add recipes for the builder actions panel (mapped to concrete Action[] in the app). */
export type InteractionPreset = {
  id: string;
  label: string;
  description?: string;
  eventName: string;
  templateKey: "buttonFetchTable" | "rowModalSubmit" | "notify";
};

export type ComponentCapabilities = {
  supportsDataSource?: boolean;
  supportsActions?: boolean;
  supportsRowActions?: boolean;
  supportsVisibilityRules?: boolean;
  supportedLayoutModes?: readonly ("flow" | "stack" | "grid" | "absolute")[];
  /** Optional one-click side-effect starters for this component type. */
  interactionPresets?: readonly InteractionPreset[];
};

export const COMPONENT_CAPABILITY_SCHEMA = {
  supportsDataSource: "boolean",
  supportsActions: "boolean",
  supportsRowActions: "boolean",
  supportsVisibilityRules: "boolean",
  supportedLayoutModes: ["flow", "stack", "grid", "absolute"] as const,
} as const;

export type CapabilityValidationIssue = {
  path: string;
  message: string;
};

export type CapabilityValidationResult = {
  ok: boolean;
  issues: CapabilityValidationIssue[];
};

export function validateComponentCapabilities(
  value: unknown,
): CapabilityValidationResult {
  const issues: CapabilityValidationIssue[] = [];
  if (!value || typeof value !== "object") {
    return {
      ok: false,
      issues: [{ path: "capabilities", message: "Capabilities must be an object." }],
    };
  }

  const caps = value as Record<string, unknown>;
  const booleanFields = [
    "supportsDataSource",
    "supportsActions",
    "supportsRowActions",
    "supportsVisibilityRules",
  ] as const;

  for (const field of booleanFields) {
    const raw = caps[field];
    if (raw !== undefined && typeof raw !== "boolean") {
      issues.push({
        path: `capabilities.${field}`,
        message: "Expected boolean when provided.",
      });
    }
  }

  if (caps.supportedLayoutModes !== undefined) {
    if (!Array.isArray(caps.supportedLayoutModes)) {
      issues.push({
        path: "capabilities.supportedLayoutModes",
        message: "Expected an array of layout mode strings.",
      });
    } else {
      for (let i = 0; i < caps.supportedLayoutModes.length; i += 1) {
        const mode = caps.supportedLayoutModes[i];
        if (
          mode !== "flow" &&
          mode !== "stack" &&
          mode !== "grid" &&
          mode !== "absolute"
        ) {
          issues.push({
            path: `capabilities.supportedLayoutModes[${i}]`,
            message: `Unsupported layout mode "${String(mode)}".`,
          });
        }
      }
    }
  }

  if (caps.supportsRowActions === true && caps.supportsActions === false) {
    issues.push({
      path: "capabilities.supportsRowActions",
      message: "supportsRowActions requires supportsActions to be true or omitted.",
    });
  }

  return { ok: issues.length === 0, issues };
}

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

/**
 * Adapter contract for wiring a UI component library into AIUI.
 * Future libraries (beyond shadcn) should implement this interface.
 */
export type UiAdapterDefinition = {
  id: string;
  displayName: string;
  packageName: string;
  version: string;
  /**
   * Component types exposed by this adapter.
   * This allows compatibility checks before exposing components in the builder.
   */
  supportedTypes: readonly string[];
  /** Returns the component definition for a given `UiNode.type`. */
  getDefinition: (type: string) => ComponentDefinition | undefined;
  /** Lists all component definitions this adapter provides. */
  listDefinitions: () => readonly ComponentDefinition[];
};

/**
 * Dropped `Table` / `Card` nodes get a starter subtree so users can configure
 * toolbar, body, and pagination (or card sections) as separate layers.
 * IDs are templates — `createNodeFromType` assigns fresh ids per insert.
 */
const TABLE_DROP_IN_REGIONS: UiNode = {
  id: "tpl-table-regions",
  type: STACK_TYPE,
  props: {
    direction: "column",
    gap: 8,
    label: "Table regions",
  },
  children: [
    {
      id: "tpl-table-toolbar",
      type: BOX_TYPE,
      props: { label: "Header / toolbar" },
    },
    {
      id: "tpl-table-body",
      type: BOX_TYPE,
      props: { label: "Rows" },
    },
    {
      id: "tpl-table-pagination",
      type: STACK_TYPE,
      props: { direction: "row", gap: 8, label: "Pagination" },
      children: [
        {
          id: "tpl-table-prev",
          type: BUTTON_TYPE,
          props: { label: "Prev" },
        },
        {
          id: "tpl-table-page",
          type: BOX_TYPE,
          props: { label: "Page 1 of 3" },
        },
        {
          id: "tpl-table-next",
          type: BUTTON_TYPE,
          props: { label: "Next" },
        },
      ],
    },
  ],
};

const CARD_DROP_IN_REGIONS: UiNode = {
  id: "tpl-card-regions",
  type: STACK_TYPE,
  props: { direction: "column", gap: 8, label: "Card sections" },
  children: [
    {
      id: "tpl-card-title",
      type: BOX_TYPE,
      props: { label: "Title row" },
    },
    {
      id: "tpl-card-body",
      type: BOX_TYPE,
      props: { label: "Body" },
    },
    {
      id: "tpl-card-meta",
      type: BADGE_TYPE,
      props: { label: "Meta" },
    },
  ],
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
  [BUTTON_TYPE]: {
    type: BUTTON_TYPE,
    displayName: "Button",
    defaultProps: { label: "Button", variant: "default" },
    ux: {
      palette: {
        category: "input",
        keywords: ["shadcn", "button", "cta", "click", "action"],
        description: "Trigger actions",
      },
      capabilities: {
        supportsActions: true,
        supportsVisibilityRules: true,
        supportedLayoutModes: ["flow", "stack", "grid"],
        interactionPresets: [
          {
            id: "btn-fetch-table",
            label: "Click → fetch table data",
            description: "GET example API and store rows in state",
            eventName: "click",
            templateKey: "buttonFetchTable",
          },
          {
            id: "btn-notify",
            label: "Click → toast",
            eventName: "click",
            templateKey: "notify",
          },
        ],
      },
      inspector: {
        defaultSection: "content",
        sectionOrder: INSPECTOR_SECTION_ORDER,
        fields: [
          {
            kind: "text",
            key: "label",
            label: "Label",
            placeholder: "Button",
          },
          {
            kind: "select",
            key: "variant",
            label: "Variant",
            options: [
              { value: "default", label: "Default" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
              { value: "ghost", label: "Ghost" },
              { value: "destructive", label: "Destructive" },
            ],
          },
        ],
      },
    },
  },
  [INPUT_TYPE]: {
    type: INPUT_TYPE,
    displayName: "Input",
    defaultProps: { placeholder: "Type here..." },
    ux: {
      palette: {
        category: "input",
        keywords: ["shadcn", "input", "field", "text", "form"],
        description: "Single-line text field",
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
            key: "placeholder",
            label: "Placeholder",
            placeholder: "Type here...",
          },
        ],
      },
    },
  },
  [CARD_TYPE]: {
    type: CARD_TYPE,
    displayName: "Card",
    defaultProps: { label: "Card", description: "Card description" },
    defaultChildren: [CARD_DROP_IN_REGIONS],
    ux: {
      palette: {
        category: "display",
        keywords: ["shadcn", "card", "panel", "container", "surface"],
        description: "Grouped surface for content",
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
            label: "Title",
            placeholder: "Card",
          },
          {
            kind: "text",
            key: "description",
            label: "Description",
            placeholder: "Card description",
          },
        ],
      },
    },
  },
  [TABLE_TYPE]: {
    type: TABLE_TYPE,
    displayName: "Table",
    defaultProps: { label: "Table", emptyState: "No rows yet" },
    defaultChildren: [TABLE_DROP_IN_REGIONS],
    ux: {
      palette: {
        category: "data",
        keywords: ["shadcn", "table", "rows", "columns", "data-grid"],
        description: "Tabular data display",
      },
      capabilities: {
        supportsDataSource: true,
        supportsActions: true,
        supportsRowActions: true,
        supportsVisibilityRules: true,
        supportedLayoutModes: ["flow", "stack", "grid"],
        interactionPresets: [
          {
            id: "table-refresh",
            label: "Click → fetch table data",
            description: "Example GET and assign to state",
            eventName: "click",
            templateKey: "buttonFetchTable",
          },
          {
            id: "table-row-modal",
            label: "Row action → modal + refresh",
            eventName: "rowAction",
            templateKey: "rowModalSubmit",
          },
        ],
      },
      inspector: {
        defaultSection: "data",
        sectionOrder: INSPECTOR_SECTION_ORDER,
        fields: [
          {
            kind: "text",
            key: "label",
            label: "Title",
            placeholder: "Table",
          },
          {
            kind: "text",
            key: "emptyState",
            label: "Empty state",
            placeholder: "No rows yet",
          },
        ],
      },
    },
  },
  [BADGE_TYPE]: {
    type: BADGE_TYPE,
    displayName: "Badge",
    defaultProps: { label: "Status", variant: "secondary" },
    ux: {
      palette: {
        category: "display",
        keywords: ["shadcn", "badge", "status", "tag", "pill"],
        description: "Small status indicator",
      },
      capabilities: {
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
            placeholder: "Status",
          },
          {
            kind: "select",
            key: "variant",
            label: "Variant",
            options: [
              { value: "default", label: "Default" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
              { value: "destructive", label: "Destructive" },
            ],
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

export function validateCapabilitiesForType(type: string): CapabilityValidationResult {
  const caps = getCapabilities(type);
  if (!caps) return { ok: true, issues: [] };
  return validateComponentCapabilities(caps);
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

export const SHADCN_ADAPTER: UiAdapterDefinition = {
  id: "shadcn",
  displayName: "shadcn/ui",
  packageName: "@aiui/registry",
  version: "0.1.0",
  supportedTypes: Object.keys(primitives),
  getDefinition,
  listDefinitions: () => Object.values(primitives),
};
