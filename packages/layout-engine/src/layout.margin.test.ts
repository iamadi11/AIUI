import { describe, expect, it } from "vitest";
import { layoutDocument } from "./layout";

const ROOT = "a0000000-0000-4000-8000-000000000001";
const A = "b0000000-0000-4000-8000-000000000001";
const B = "c0000000-0000-4000-8000-000000000001";

describe("layout margin", () => {
  it("offsets siblings in a column via margin-top on the second child", () => {
    const root = {
      id: ROOT,
      type: "Stack",
      props: { direction: "column", gap: 0, label: "" },
      children: [
        { id: A, type: "Box", props: {}, children: [] },
        {
          id: B,
          type: "Box",
          props: {},
          layout: { margin: { top: 10 } },
          children: [],
        },
      ],
    };
    const rects = layoutDocument(root, { width: 400 });
    const rA = rects.get(A)!;
    const rB = rects.get(B)!;
    expect(rB.y).toBe(rA.y + rA.height + 10);
  });

  it("includes horizontal margin in a row stack", () => {
    const root = {
      id: ROOT,
      type: "Stack",
      props: { direction: "row", gap: 0, label: "" },
      children: [
        { id: A, type: "Box", props: {}, children: [] },
        {
          id: B,
          type: "Box",
          props: {},
          layout: { margin: { left: 12 } },
          children: [],
        },
      ],
    };
    const rects = layoutDocument(root, { width: 400 });
    const rA = rects.get(A)!;
    const rB = rects.get(B)!;
    expect(rB.x).toBe(rA.x + rA.width + 12);
  });

  it("wraps row stack children when wrap is enabled", () => {
    const root = {
      id: ROOT,
      type: "Stack",
      props: { direction: "row", gap: 8, label: "" },
      layout: { wrap: true, rowGap: 10 },
      children: [
        {
          id: A,
          type: "Box",
          props: {},
          layout: { width: 60, height: 32 },
          children: [],
        },
        {
          id: B,
          type: "Box",
          props: {},
          layout: { width: 60, height: 32 },
          children: [],
        },
      ],
    };
    const rects = layoutDocument(root, { width: 120 });
    const rA = rects.get(A)!;
    const rB = rects.get(B)!;
    expect(rB.y).toBe(rA.y + rA.height + 10);
    expect(rB.x).toBe(rA.x);
  });
});
