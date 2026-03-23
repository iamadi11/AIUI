import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { AIInferenceRequestPayload } from "@dynaui/core";

export const runtime = "nodejs";

const MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let payload: AIInferenceRequestPayload;
  try {
    payload = (await req.json()) as AIInferenceRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.schemaSignature || !payload.schemaTree) {
    return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: key });

  const system = `You are DynaUI layout inference. Given ONLY a schema tree (types, field names, hints — no raw user values), output a single JSON object matching this TypeScript shape:
{
  "rankedComponents": { "componentId": string, "score": number, "reasoning"?: string }[],
  "layoutHints"?: { "emphasizePaths"?: string[][], "columns"?: string[][] }
}
Rules:
- Pick 1-3 entries in rankedComponents from this allowlist only: ${JSON.stringify(payload.availableComponents)}.
- Prefer dashboards: if multiple views help, return multiple ranked components (e.g. DataTable + MetricGrid).
- Respond with JSON only, no markdown.`;

  const user = JSON.stringify({
    schemaSignature: payload.schemaSignature,
    schemaTree: payload.schemaTree,
    ruleCandidates: payload.ruleCandidates,
  });

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: "Model did not return JSON" }, { status: 502 });
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as unknown;
    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Inference failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
