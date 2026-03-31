import { z } from "zod";

/** Semantic version of the document format (not layout algorithm). */
export const DSL_VERSION = "0.1.0";

/**
 * Layout algorithm version (deterministic engine in `@aiui/layout-engine`).
 * Bump when layout rules change incompatibly.
 */
export const LAYOUT_VERSION = "0.1.0";

export type UiNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: UiNode[];
  layout?: Record<string, unknown>;
  style?: Record<string, unknown>;
};

export const uiNodeSchema: z.ZodType<UiNode> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
    children: z.array(uiNodeSchema).optional(),
    layout: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
  }),
);

export const documentSchema = z.object({
  version: z.string().min(1),
  /** Which layout rules produced `layout` rects (see `LAYOUT_VERSION`). */
  layoutVersion: z.string().min(1).optional(),
  root: uiNodeSchema,
});

export type AiuiDocument = z.infer<typeof documentSchema>;

export function parseDocument(data: unknown): AiuiDocument {
  return documentSchema.parse(data);
}

export function safeParseDocument(data: unknown) {
  return documentSchema.safeParse(data);
}
