import { z } from "zod";
import type { Action } from "./actions";
import { actionSchema } from "./actions";
import { bindingsRecordSchema, type BindingDescriptor } from "./bindings";
import { migrateDocument } from "./migrate";

export type { Action };
export {
  actionSchema,
  actionsArraySchema,
  parseAction,
  safeParseAction,
  safeParseActionsArray,
} from "./actions";

export type UiLayoutResponsiveOverride = {
  direction?: "row" | "column";
  wrap?: boolean;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  minChildWidth?: number;
  gridColumns?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
};

export type UiLayout = {
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  layoutMode?: "flow" | "stack" | "grid" | "absolute";
  wrap?: boolean;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  minChildWidth?: number;
  gridColumns?: number;
  responsive?: {
    tablet?: UiLayoutResponsiveOverride;
    mobile?: UiLayoutResponsiveOverride;
  };
  [key: string]: unknown;
};

export type UiNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  /** Property-key -> binding descriptor (`static`/`expression`/`state`/`query`). */
  bindings?: Record<string, BindingDescriptor>;
  children?: UiNode[];
  layout?: UiLayout;
  style?: Record<string, unknown>;
  /** Event name → ordered actions (e.g. `click`, `submit`). */
  events?: Record<string, Action[]>;
};

const boxSidesSchema = z
  .object({
    top: z.number().finite().optional(),
    right: z.number().finite().optional(),
    bottom: z.number().finite().optional(),
    left: z.number().finite().optional(),
  })
  .partial();

const responsiveOverrideSchema = z
  .object({
    direction: z.enum(["row", "column"]).optional(),
    wrap: z.boolean().optional(),
    gap: z.number().finite().optional(),
    rowGap: z.number().finite().optional(),
    columnGap: z.number().finite().optional(),
    minChildWidth: z.number().finite().optional(),
    gridColumns: z.number().int().positive().optional(),
    minWidth: z.number().finite().optional(),
    maxWidth: z.number().finite().optional(),
    minHeight: z.number().finite().optional(),
    maxHeight: z.number().finite().optional(),
  })
  .passthrough();

const uiLayoutSchema: z.ZodType<UiLayout> = z
  .object({
    padding: z.union([z.number().finite(), boxSidesSchema]).optional(),
    margin: z.union([z.number().finite(), boxSidesSchema]).optional(),
    width: z.number().finite().optional(),
    height: z.number().finite().optional(),
    minWidth: z.number().finite().optional(),
    maxWidth: z.number().finite().optional(),
    minHeight: z.number().finite().optional(),
    maxHeight: z.number().finite().optional(),
    layoutMode: z.enum(["flow", "stack", "grid", "absolute"]).optional(),
    wrap: z.boolean().optional(),
    gap: z.number().finite().optional(),
    rowGap: z.number().finite().optional(),
    columnGap: z.number().finite().optional(),
    minChildWidth: z.number().finite().optional(),
    gridColumns: z.number().int().positive().optional(),
    responsive: z
      .object({
        tablet: responsiveOverrideSchema.optional(),
        mobile: responsiveOverrideSchema.optional(),
      })
      .optional(),
  })
  .passthrough();

export const uiNodeSchema: z.ZodType<UiNode> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
    bindings: bindingsRecordSchema.optional(),
    children: z.array(uiNodeSchema).optional(),
    layout: uiLayoutSchema.optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    events: z
      .record(z.string().min(1), z.array(actionSchema))
      .optional(),
  }),
);

/** Stable id for the first screen when migrating legacy single-root documents. */
export const DEFAULT_SCREEN_ID = "default";

export type ScreenRole = "page" | "modal";

export type ScreenDefinition = {
  title?: string;
  /** `modal` screens are intended for `modal` actions targeting this screen id. */
  role?: ScreenRole;
  root: UiNode;
};

export type PrototypeEdgeKind = "navigate" | "modal";

/**
 * Prototype edge (React Flow) between screens. When `sourceNodeId` is set, the
 * builder syncs the corresponding `events` entry on that node.
 */
export type PrototypeEdge = {
  id: string;
  source: string;
  target: string;
  kind: PrototypeEdgeKind;
  sourceNodeId?: string;
  event?: string;
};

export type FlowLayout = {
  positions: Record<string, { x: number; y: number }>;
  edges?: PrototypeEdge[];
};

const screenDefinitionSchema = z.object({
  title: z.string().optional(),
  role: z.enum(["page", "modal"]).optional(),
  root: uiNodeSchema,
});

const flowPositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const prototypeEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  kind: z.enum(["navigate", "modal"]),
  sourceNodeId: z.string().optional(),
  event: z.string().optional(),
});

const flowLayoutSchema = z.object({
  positions: z.record(z.string(), flowPositionSchema),
  edges: z.array(prototypeEdgeSchema).optional(),
});

export const documentSchema = z
  .object({
    version: z.string().min(1),
    /** Which layout rules produced `layout` rects (see `LAYOUT_VERSION`). */
    layoutVersion: z.string().min(1).optional(),
    /** Initial logic state for expressions and `setState` paths. */
    state: z.record(z.string(), z.unknown()).optional(),
    /** Screen id → UI tree. At least one screen is required. */
    screens: z.record(z.string(), screenDefinitionSchema),
    /** Initial screen for runtime / published preview. */
    initialScreenId: z.string().min(1),
    /** React Flow screen graph positions and prototype edges. */
    flowLayout: flowLayoutSchema.optional(),
  })
  .superRefine((doc, ctx) => {
    if (!doc.screens[doc.initialScreenId]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `initialScreenId "${doc.initialScreenId}" has no matching screen`,
        path: ["initialScreenId"],
      });
    }
  });

export type AiuiDocument = z.infer<typeof documentSchema>;

/** Root node for a given screen (read-only). */
export function getScreenRoot(
  doc: AiuiDocument,
  screenId: string,
): UiNode | undefined {
  return doc.screens[screenId]?.root;
}

/** Root used by the runtime for the initial route (before in-app navigation). */
export function getRuntimeScreenRoot(doc: AiuiDocument): UiNode {
  const r = doc.screens[doc.initialScreenId]?.root;
  if (!r) {
    throw new Error(`Invalid document: missing screen "${doc.initialScreenId}"`);
  }
  return r;
}

export function listScreenIds(doc: AiuiDocument): string[] {
  return Object.keys(doc.screens);
}

/** View for editor components that still expect a single `root` (active screen). */
export type AiuiDocumentEditorView = AiuiDocument & { root: UiNode };

export function editorDocumentView(
  doc: AiuiDocument,
  activeScreenId: string,
): AiuiDocumentEditorView {
  const root = doc.screens[activeScreenId]?.root;
  if (!root) {
    throw new Error(`Unknown screen: ${activeScreenId}`);
  }
  return { ...doc, root };
}

export function parseDocument(data: unknown): AiuiDocument {
  return documentSchema.parse(data);
}

export function safeParseDocument(data: unknown) {
  return documentSchema.safeParse(data);
}

export function safeParseDocumentWithMigration(data: unknown) {
  return safeParseDocument(migrateDocument(data));
}
