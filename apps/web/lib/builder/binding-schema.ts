import type { BindingDescriptor } from "@aiui/dsl-schema";
import { safeParseBindingDescriptor } from "@aiui/dsl-schema";

/**
 * Ensures a binding matches the DSL discriminated union before persisting.
 * Use this on apply; sample-data validation is separate.
 */
export function validateBindingDescriptorSchema(
  b: BindingDescriptor,
):
  | { ok: true; data: BindingDescriptor }
  | { ok: false; message: string } {
  const r = safeParseBindingDescriptor(b);
  if (r.success) return { ok: true, data: r.data };
  const message = r.error.issues.map((i) => i.message).join("; ");
  return { ok: false, message };
}
