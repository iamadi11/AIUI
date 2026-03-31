import { evaluateExpression } from "./evaluate";
import { ExpressionError } from "./errors";

const MAX_TEMPLATE_LEN = 100_000;

function formatTemplateValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    return String(v);
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Replace `{{ expression }}` segments with evaluated values (no `eval`).
 * Expressions use the same grammar as `evaluateExpression`.
 */
export function interpolateTemplate(
  template: string,
  context: Record<string, unknown>,
): string {
  if (template.length > MAX_TEMPLATE_LEN) {
    throw new ExpressionError("Template too long", 0);
  }
  let out = "";
  let i = 0;
  while (i < template.length) {
    const start = template.indexOf("{{", i);
    if (start === -1) {
      out += template.slice(i);
      break;
    }
    out += template.slice(i, start);
    const end = template.indexOf("}}", start);
    if (end === -1) {
      throw new ExpressionError("Unclosed {{ in template", start);
    }
    const expr = template.slice(start + 2, end).trim();
    if (expr.length === 0) {
      throw new ExpressionError("Empty expression in {{ }}", start);
    }
    const value = evaluateExpression(expr, context);
    out += formatTemplateValue(value);
    i = end + 2;
  }
  return out;
}
