import { z } from "zod";

/**
 * Discriminated logic actions (Phase 3). Executed by `@aiui/logic` / runtime — not `eval`.
 */
export type Action =
  | { type: "setState"; path: string; value: unknown }
  | { type: "navigate"; href: string }
  | {
      type: "http";
      method: "GET" | "POST";
      url: string;
      headers?: Record<string, string>;
      body?: unknown;
    }
  | { type: "sequence"; steps: Action[] }
  | { type: "condition"; when: string; then: Action; else?: Action };

export const actionSchema: z.ZodType<Action> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal("setState"),
      path: z.string().min(1),
      value: z.any(),
    }),
    z.object({
      type: z.literal("navigate"),
      href: z.string().min(1),
    }),
    z.object({
      type: z.literal("http"),
      method: z.enum(["GET", "POST"]),
      url: z.string().min(1),
      headers: z.record(z.string(), z.string()).optional(),
      body: z.any().optional(),
    }),
    z.object({
      type: z.literal("sequence"),
      steps: z.array(actionSchema),
    }),
    z.object({
      type: z.literal("condition"),
      when: z.string().min(1),
      then: actionSchema,
      else: actionSchema.optional(),
    }),
  ]),
) as z.ZodType<Action>;

export const actionsArraySchema = z.array(actionSchema);

export function parseAction(data: unknown): Action {
  return actionSchema.parse(data);
}

export function safeParseAction(data: unknown) {
  return actionSchema.safeParse(data);
}

export function safeParseActionsArray(data: unknown) {
  return actionsArraySchema.safeParse(data);
}
