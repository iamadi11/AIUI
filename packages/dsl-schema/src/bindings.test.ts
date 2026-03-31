import { describe, expect, it } from "vitest";
import {
  bindingDescriptorSchema,
  DEFAULT_SCREEN_ID,
  DSL_VERSION,
  safeParseBindingDescriptor,
  safeParseDocument,
} from "./index";

const ROOT_ID = "10000000-0000-4000-8000-000000000001";

describe("bindingDescriptorSchema", () => {
  it("accepts static, expression, state, and query descriptors", () => {
    const descriptors = [
      { kind: "static", value: "hello" },
      { kind: "expression", expression: "count > 0", fallback: false },
      { kind: "state", path: "filters.status", fallback: "all" },
      { kind: "query", source: "orders", path: "rows", fallback: [] },
    ];
    for (const d of descriptors) {
      expect(bindingDescriptorSchema.safeParse(d).success).toBe(true);
    }
  });

  it("rejects malformed descriptor", () => {
    const bad = { kind: "query", source: "", path: "" };
    const r = safeParseBindingDescriptor(bad);
    expect(r.success).toBe(false);
  });
});

describe("document schema with bindings", () => {
  it("accepts bindings record on node", () => {
    const doc = {
      version: DSL_VERSION,
      layoutVersion: "0.1.0",
      screens: {
        [DEFAULT_SCREEN_ID]: {
          root: {
            id: ROOT_ID,
            type: "Box",
            props: {},
            bindings: {
              title: { kind: "static", value: "Revenue" },
              rows: { kind: "query", source: "orders", path: "items" },
            },
          },
        },
      },
      initialScreenId: DEFAULT_SCREEN_ID,
      flowLayout: {
        positions: { [DEFAULT_SCREEN_ID]: { x: 0, y: 0 } },
        edges: [],
      },
    };
    const r = safeParseDocument(doc);
    expect(r.success).toBe(true);
  });
});
