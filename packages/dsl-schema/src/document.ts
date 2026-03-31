import { z } from "zod";
import type { Action } from "./actions";
import { actionSchema } from "./actions";
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
    children: z.array(uiNodeSchema).optional(),
    layout: uiLayoutSchema.optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    events: z
      .record(z.string().min(1), z.array(actionSchema))
      .optional(),
  }),
);

export const documentSchema = z.object({
  version: z.string().min(1),
  /** Which layout rules produced `layout` rects (see `LAYOUT_VERSION`). */
  layoutVersion: z.string().min(1).optional(),
  /** Initial logic state for expressions and `setState` paths. */
  state: z.record(z.string(), z.unknown()).optional(),
  root: uiNodeSchema,
});

export type AiuiDocument = z.infer<typeof documentSchema>;

export function parseDocument(data: unknown): AiuiDocument {
  return documentSchema.parse(data);
}

export function safeParseDocument(data: unknown) {
  return documentSchema.safeParse(data);
}

export function safeParseDocumentWithMigration(data: unknown) {
  return safeParseDocument(migrateDocument(data));
}
