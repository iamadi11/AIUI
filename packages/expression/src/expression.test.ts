import { describe, expect, it } from "vitest";
import { evaluateExpression } from "./evaluate";
import { ExpressionError } from "./errors";
import { interpolateTemplate } from "./template";

describe("evaluateExpression", () => {
  it("resolves dotted paths from context", () => {
    expect(
      evaluateExpression("user.name", {
        user: { name: "Ada" },
      }),
    ).toBe("Ada");
  });

  it("evaluates arithmetic and comparisons", () => {
    expect(evaluateExpression("1 + 2 * 3", {})).toBe(7);
    expect(evaluateExpression("10 > 3", {})).toBe(true);
    expect(evaluateExpression("a == b", { a: 1, b: 1 })).toBe(true);
  });

  it("short-circuits logical ops", () => {
    expect(evaluateExpression("false || ok", { ok: 1 })).toBe(1);
    expect(evaluateExpression("false && boom", { boom: 1 })).toBe(false);
  });

  it("rejects unsafe path segments", () => {
    expect(() =>
      evaluateExpression("a.__proto__", { a: { x: 1 } }),
    ).toThrow(ExpressionError);
  });
});

describe("interpolateTemplate", () => {
  it("substitutes expressions", () => {
    expect(
      interpolateTemplate("Hi {{ user.name }}", {
        user: { name: "Ada" },
      }),
    ).toBe("Hi Ada");
  });

  it("throws on unclosed delimiter", () => {
    expect(() => interpolateTemplate("{{ a", {})).toThrow(ExpressionError);
  });
});
