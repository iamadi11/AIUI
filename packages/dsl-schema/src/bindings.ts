import { z } from "zod";

/**
 * Universal property binding descriptor used by builder/runtime.
 * `kind` is discriminant so editors can progressively expose modes.
 */
export type BindingDescriptor =
  | {
      kind: "static";
      value: unknown;
    }
  | {
      kind: "expression";
      expression: string;
      fallback?: unknown;
    }
  | {
      kind: "state";
      path: string;
      fallback?: unknown;
    }
  | {
      kind: "query";
      source: string;
      path: string;
      fallback?: unknown;
    };

export const bindingDescriptorSchema = z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("static"),
      value: z.unknown(),
    }),
    z.object({
      kind: z.literal("expression"),
      expression: z.string().min(1),
      fallback: z.unknown().optional(),
    }),
    z.object({
      kind: z.literal("state"),
      path: z.string().min(1),
      fallback: z.unknown().optional(),
    }),
    z.object({
      kind: z.literal("query"),
      source: z.string().min(1),
      path: z.string().min(1),
      fallback: z.unknown().optional(),
    }),
  ]) as z.ZodType<BindingDescriptor>;

export const bindingsRecordSchema = z.record(z.string(), bindingDescriptorSchema);

export function parseBindingDescriptor(data: unknown): BindingDescriptor {
  return bindingDescriptorSchema.parse(data);
}

export function safeParseBindingDescriptor(data: unknown) {
  return bindingDescriptorSchema.safeParse(data);
}
