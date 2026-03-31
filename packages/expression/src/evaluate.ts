import type { BinaryOp, Expr } from "./ast";
import { ExpressionError } from "./errors";
import { parseExpression } from "./parser";

const UNSAFE_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

function assertSafeSegment(seg: string, offset = 0): void {
  if (UNSAFE_SEGMENTS.has(seg)) {
    throw new ExpressionError(`Invalid path segment: ${seg}`, offset);
  }
}

function getPath(root: unknown, segments: string[]): unknown {
  let cur: unknown = root;
  for (const seg of segments) {
    assertSafeSegment(seg);
    if (cur === null || cur === undefined) {
      return undefined;
    }
    if (typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

function isTruthy(v: unknown): boolean {
  if (v === false || v === null || v === undefined) return false;
  if (typeof v === "number" && (v === 0 || Number.isNaN(v))) return false;
  if (v === "") return false;
  return true;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : Number.NaN;
  }
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? Number.NaN : n;
  }
  if (v === null || v === undefined) return Number.NaN;
  return Number(v);
}

type NonShortBinaryOp = Exclude<BinaryOp, "||" | "&&">;

function applyBinary(op: NonShortBinaryOp, left: unknown, right: unknown): unknown {
  switch (op) {
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "<":
      return (toNumber(left) as number) < (toNumber(right) as number);
    case ">":
      return (toNumber(left) as number) > (toNumber(right) as number);
    case "<=":
      return (toNumber(left) as number) <= (toNumber(right) as number);
    case ">=":
      return (toNumber(left) as number) >= (toNumber(right) as number);
    case "+": {
      if (typeof left === "string" || typeof right === "string") {
        return String(left ?? "") + String(right ?? "");
      }
      return (toNumber(left) as number) + (toNumber(right) as number);
    }
    case "-":
      return (toNumber(left) as number) - (toNumber(right) as number);
    case "*":
      return (toNumber(left) as number) * (toNumber(right) as number);
    case "/": {
      const b = toNumber(right) as number;
      if (b === 0) {
        throw new ExpressionError("Division by zero");
      }
      return (toNumber(left) as number) / b;
    }
    case "%": {
      const b = toNumber(right) as number;
      if (b === 0) {
        throw new ExpressionError("Modulo by zero");
      }
      return (toNumber(left) as number) % b;
    }
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

export function evaluate(expr: Expr, context: Record<string, unknown>): unknown {
  switch (expr.kind) {
    case "literal":
      return expr.value;
    case "path":
      return getPath(context, expr.segments);
    case "unary": {
      const v = evaluate(expr.arg, context);
      if (expr.op === "!") {
        return !isTruthy(v);
      }
      return -(toNumber(v) as number);
    }
    case "binary": {
      if (expr.op === "||") {
        const l = evaluate(expr.left, context);
        if (isTruthy(l)) return l;
        return evaluate(expr.right, context);
      }
      if (expr.op === "&&") {
        const l = evaluate(expr.left, context);
        if (!isTruthy(l)) return l;
        return evaluate(expr.right, context);
      }
      const l = evaluate(expr.left, context);
      const r = evaluate(expr.right, context);
      return applyBinary(expr.op, l, r);
    }
    default: {
      const _e: never = expr;
      return _e;
    }
  }
}

export function evaluateExpression(
  source: string,
  context: Record<string, unknown>,
): unknown {
  return evaluate(parseExpression(source), context);
}
