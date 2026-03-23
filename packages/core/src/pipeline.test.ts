import { describe, expect, it } from "vitest";
import { runPipeline } from "./pipeline.js";

describe("runPipeline", () => {
  it("selects DataTable for array of objects", () => {
    const data = [
      { id: 1, name: "a", value: 10 },
      { id: 2, name: "b", value: 20 },
    ];
    const r = runPipeline(data);
    expect(r.plan.componentId).toBe("DataTable");
    expect(r.trace.path).toBe("RULE");
    expect(r.needsAI).toBe(false);
  });

  it("selects KeyValueList for flat object", () => {
    const data = { a: 1, b: "x", c: true };
    const r = runPipeline(data);
    expect(r.plan.componentId).toBe("KeyValueList");
  });

  it("applies AI response when provided", () => {
    const data = [{ x: 1 }];
    const r = runPipeline(data, {
      aiResponse: {
        rankedComponents: [
          { componentId: "MetricGrid", score: 0.99, reasoning: "metrics" },
        ],
      },
    });
    expect(r.trace.path).toBe("AI");
    expect(r.plan.componentId).toBe("MetricGrid");
  });
});
