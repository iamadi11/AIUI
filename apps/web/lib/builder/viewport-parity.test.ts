import type { UiNode } from "@aiui/dsl-schema";
import { describe, expect, it } from "vitest";
import { buildViewportParityReport } from "./viewport-parity";

function demoRoot(): UiNode {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    type: "Stack",
    props: {},
    layout: { gap: 12, padding: 16 },
    children: [
      {
        id: "10000000-0000-4000-8000-000000000002",
        type: "Card",
        props: { label: "Revenue", description: "Monthly trend" },
        layout: { padding: 12, margin: { bottom: 12 } },
        children: [],
      },
      {
        id: "10000000-0000-4000-8000-000000000003",
        type: "Table",
        props: { label: "Orders", emptyState: "No rows yet" },
        layout: { margin: { bottom: 12 } },
        children: [],
      },
      {
        id: "10000000-0000-4000-8000-000000000004",
        type: "Button",
        props: { label: "Refresh" },
        events: {
          click: [{ type: "fetch", method: "GET", url: "https://example.com/api" }],
        },
        children: [],
      },
    ],
  };
}

describe("buildViewportParityReport", () => {
  it("captures a stable layout parity snapshot across presets", () => {
    const report = buildViewportParityReport(demoRoot());
    expect(report.ok).toBe(true);
    expect(
      report.rows.map((row) => ({
        viewportId: row.viewportId,
        width: row.width,
        nodeCount: row.nodeCount,
        invalidRectCount: row.invalidRectCount,
        deterministic: row.deterministic,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "deterministic": true,
          "invalidRectCount": 0,
          "nodeCount": 4,
          "viewportId": "desktop",
          "width": 1280,
        },
        {
          "deterministic": true,
          "invalidRectCount": 0,
          "nodeCount": 4,
          "viewportId": "tablet",
          "width": 768,
        },
        {
          "deterministic": true,
          "invalidRectCount": 0,
          "nodeCount": 4,
          "viewportId": "mobile",
          "width": 390,
        },
      ]
    `);
  });
});
