import { describe, expect, it } from "vitest";
import { buildDataTree } from "./analysis.js";
import {
  buildAIInferencePayload,
  payloadExcludesDataValues,
} from "./ai-serialize.js";
import type { ComponentCandidate } from "./types.js";

describe("AI payload privacy", () => {
  it("does not include secret string values from user data", () => {
    const secret = "user-secret-token-xyz";
    const data = { email: "u@example.com", token: secret, items: [{ title: "hello" }] };
    const root = buildDataTree(data);
    const payload = buildAIInferencePayload(root, [
      { componentId: "PropertyCard", score: 0.5 },
    ] as ComponentCandidate[]);
    expect(payloadExcludesDataValues(payload, data)).toBe(true);
    const json = JSON.stringify(payload);
    expect(json).not.toContain(secret);
    expect(json).not.toContain("hello");
  });
});
