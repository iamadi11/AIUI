import type { UiNode } from "@aiui/dsl-schema";
import { layoutDocument } from "@aiui/layout-engine";
import { VIEWPORT_PRESETS } from "@/lib/builder/viewport-presets";

export type ViewportParityRow = {
  viewportId: string;
  viewportLabel: string;
  width: number;
  nodeCount: number;
  invalidRectCount: number;
  deterministic: boolean;
};

export type ViewportParityReport = {
  ok: boolean;
  rows: ViewportParityRow[];
};

function collectNodeIds(root: UiNode): string[] {
  const out: string[] = [];
  function walk(node: UiNode) {
    out.push(node.id);
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return out;
}

function isValidRect(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  const nums = [r.x, r.y, r.width, r.height];
  return nums.every(
    (n) => typeof n === "number" && Number.isFinite(n),
  ) && (r.width as number) >= 0 && (r.height as number) >= 0;
}

export function buildViewportParityReport(root: UiNode): ViewportParityReport {
  const ids = collectNodeIds(root);
  const rows: ViewportParityRow[] = VIEWPORT_PRESETS.map((preset) => {
    const passA = layoutDocument(root, { width: preset.width });
    const passB = layoutDocument(root, { width: preset.width });
    let invalidRectCount = 0;
    for (const id of ids) {
      const a = passA.get(id);
      const b = passB.get(id);
      if (!isValidRect(a) || !isValidRect(b)) invalidRectCount += 1;
    }
    const deterministic =
      JSON.stringify(Object.fromEntries(passA)) ===
      JSON.stringify(Object.fromEntries(passB));
    return {
      viewportId: preset.id,
      viewportLabel: preset.label,
      width: preset.width,
      nodeCount: ids.length,
      invalidRectCount,
      deterministic,
    };
  });

  const failing = rows.filter((r) => r.invalidRectCount > 0 || !r.deterministic);
  return {
    ok: failing.length === 0,
    rows,
  };
}
