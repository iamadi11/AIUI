import type { UiNode } from "@aiui/dsl-schema";
import { layoutDocument, parsePadding } from "@aiui/layout-engine";
import { VIEWPORT_PRESETS } from "@/lib/builder/viewport-presets";

export type LayoutWarning = {
  nodeId: string;
  severity: "warning";
  code:
    | "constraint-range"
    | "constraint-value"
    | "row-overflow"
    | "invalid-grid-columns";
  message: string;
  viewport?: string;
};

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function walk(root: UiNode, visit: (node: UiNode) => void) {
  visit(root);
  for (const child of root.children ?? []) walk(child, visit);
}

function isRowStack(node: UiNode): boolean {
  return node.type === "Stack" && node.props.direction === "row";
}

function isWrapEnabled(node: UiNode): boolean {
  return node.layout?.wrap === true;
}

function nodeTitle(node: UiNode): string {
  const label = node.props.label;
  if (typeof label === "string" && label.trim()) return `"${label.trim()}"`;
  return `${node.type} (${node.id.slice(0, 8)})`;
}

function collectStaticConstraintWarnings(root: UiNode): LayoutWarning[] {
  const out: LayoutWarning[] = [];
  walk(root, (node) => {
    const minWidth = asFiniteNumber(node.layout?.minWidth);
    const maxWidth = asFiniteNumber(node.layout?.maxWidth);
    const minHeight = asFiniteNumber(node.layout?.minHeight);
    const maxHeight = asFiniteNumber(node.layout?.maxHeight);
    const width = asFiniteNumber(node.layout?.width);
    const height = asFiniteNumber(node.layout?.height);
    const gridColumns = asFiniteNumber(node.layout?.gridColumns);

    if (
      (minWidth !== undefined && maxWidth !== undefined && minWidth > maxWidth) ||
      (minHeight !== undefined && maxHeight !== undefined && minHeight > maxHeight)
    ) {
      out.push({
        nodeId: node.id,
        severity: "warning",
        code: "constraint-range",
        message: `${nodeTitle(node)} has conflicting min/max constraints.`,
      });
    }

    if (
      (width !== undefined &&
        ((minWidth !== undefined && width < minWidth) ||
          (maxWidth !== undefined && width > maxWidth))) ||
      (height !== undefined &&
        ((minHeight !== undefined && height < minHeight) ||
          (maxHeight !== undefined && height > maxHeight)))
    ) {
      out.push({
        nodeId: node.id,
        severity: "warning",
        code: "constraint-value",
        message: `${nodeTitle(node)} fixed size conflicts with its min/max bounds.`,
      });
    }

    if (gridColumns !== undefined && gridColumns < 1) {
      out.push({
        nodeId: node.id,
        severity: "warning",
        code: "invalid-grid-columns",
        message: `${nodeTitle(node)} has invalid gridColumns (< 1).`,
      });
    }
  });
  return out;
}

function collectRowOverflowWarnings(root: UiNode): LayoutWarning[] {
  const out: LayoutWarning[] = [];
  for (const preset of VIEWPORT_PRESETS) {
    const rects = layoutDocument(root, { width: preset.width });
    walk(root, (node) => {
      if (!isRowStack(node) || isWrapEnabled(node)) return;
      const parentRect = rects.get(node.id);
      if (!parentRect) return;
      const pad = parsePadding(node);
      const innerLeft = parentRect.x + pad.left;
      const innerRight = parentRect.x + parentRect.width - pad.right;
      for (const child of node.children ?? []) {
        const childRect = rects.get(child.id);
        if (!childRect) continue;
        if (childRect.x < innerLeft || childRect.x + childRect.width > innerRight) {
          out.push({
            nodeId: node.id,
            severity: "warning",
            code: "row-overflow",
            message: `${nodeTitle(node)} overflows in ${preset.label}. Consider enabling wrap or reducing fixed widths.`,
            viewport: preset.id,
          });
          return;
        }
      }
    });
  }
  return out;
}

export function collectLayoutWarnings(root: UiNode): LayoutWarning[] {
  const all = [
    ...collectStaticConstraintWarnings(root),
    ...collectRowOverflowWarnings(root),
  ];
  const deduped = new Map<string, LayoutWarning>();
  for (const w of all) {
    const key = `${w.code}:${w.nodeId}:${w.viewport ?? "-"}`;
    if (!deduped.has(key)) deduped.set(key, w);
  }
  return [...deduped.values()];
}
