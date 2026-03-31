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

export type UiNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: UiNode[];
  layout?: Record<string, unknown>;
  style?: Record<string, unknown>;
  /** Event name → ordered actions (e.g. `click`, `submit`). */
  events?: Record<string, Action[]>;
};

export const uiNodeSchema: z.ZodType<UiNode> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()),
    children: z.array(uiNodeSchema).optional(),
    layout: z.record(z.string(), z.unknown()).optional(),
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
