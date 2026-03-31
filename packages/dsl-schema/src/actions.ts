import { z } from "zod";

/**
 * Discriminated logic actions (Phase 3). Executed by `@aiui/logic` / runtime — not `eval`.
 */
export type Action =
  | { type: "setState"; path: string; value: unknown }
  | { type: "navigate"; href: string }
  /** In-app screen transition (multi-screen documents). */
  | { type: "navigateScreen"; screenId: string }
  | {
      type: "fetch";
      method: "GET" | "POST";
      url: string;
      headers?: Record<string, string>;
      body?: unknown;
      assignTo?: string;
    }
  | {
      type: "http";
      method: "GET" | "POST";
      url: string;
      headers?: Record<string, string>;
      body?: unknown;
    }
  | { type: "transform"; path: string; expression: string }
  | { type: "modal"; action: "open" | "close"; target: string }
  | {
      type: "notify";
      level: "info" | "success" | "warning" | "error";
      message: string;
    }
  | { type: "sequence"; steps: Action[] }
  | { type: "condition"; when: string; then: Action; else?: Action };

const setStateActionSchema = z.object({
  type: z.literal("setState"),
  path: z.string().min(1),
  value: z.any(),
});

const navigateActionSchema = z.object({
  type: z.literal("navigate"),
  href: z.string().min(1),
});

const navigateScreenActionSchema = z.object({
  type: z.literal("navigateScreen"),
  screenId: z.string().min(1),
});

const httpActionSchema = z.object({
  type: z.literal("http"),
  method: z.enum(["GET", "POST"]),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

const fetchActionSchema = z.object({
  type: z.literal("fetch"),
  method: z.enum(["GET", "POST"]),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  assignTo: z.string().min(1).optional(),
});

const transformActionSchema = z.object({
  type: z.literal("transform"),
  path: z.string().min(1),
  expression: z.string().min(1),
});

const modalActionSchema = z.object({
  type: z.literal("modal"),
  action: z.enum(["open", "close"]),
  target: z.string().min(1),
});

const notifyActionSchema = z.object({
  type: z.literal("notify"),
  level: z.enum(["info", "success", "warning", "error"]),
  message: z.string().min(1),
});

export const actionSchema: z.ZodType<Action> = z.lazy(() =>
  z.discriminatedUnion("type", [
    setStateActionSchema,
    navigateActionSchema,
    navigateScreenActionSchema,
    fetchActionSchema,
    httpActionSchema,
    transformActionSchema,
    modalActionSchema,
    notifyActionSchema,
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
