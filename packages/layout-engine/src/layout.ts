import type { UiNode } from "@aiui/dsl-schema";
import { parsePadding } from "./padding";
import type { IntrinsicSize, LayoutConstraints, LayoutOptions, Rect } from "./types";

const MIN_LEAF = 32;

function gapFor(node: UiNode): number {
  if (node.type !== "Stack") return 0;
  const g = node.props.gap;
  if (typeof g === "number" && Number.isFinite(g)) return Math.max(0, g);
  if (typeof g === "string") {
    const n = Number(g);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return 0;
}

function isRow(node: UiNode): boolean {
  return node.type === "Stack" && node.props.direction === "row";
}

export const BOX_TYPE = "Box";
export const STACK_TYPE = "Stack";

/**
 * Optional explicit size for **leaf** nodes (no children) via `layout.width` / `layout.height` (px).
 * When either is missing or invalid, falls back to intrinsics map or `MIN_LEAF`.
 */
function intrinsicSizeFromLayout(node: UiNode): IntrinsicSize | null {
  const rawW = node.layout?.width;
  const rawH = node.layout?.height;
  if (typeof rawW !== "number" || !Number.isFinite(rawW)) return null;
  if (typeof rawH !== "number" || !Number.isFinite(rawH)) return null;
  const w = Math.max(MIN_LEAF, rawW);
  const h = Math.max(MIN_LEAF, rawH);
  return { width: w, height: h };
}

function leafIntrinsic(
  node: UiNode,
  intrinsics: Map<string, IntrinsicSize>,
): IntrinsicSize {
  const hit = intrinsics.get(node.id);
  if (hit) return hit;
  const fromLayout = intrinsicSizeFromLayout(node);
  if (fromLayout) return fromLayout;
  return { width: MIN_LEAF, height: MIN_LEAF };
}

export function measureNode(
  node: UiNode,
  maxW: number,
  maxH: number | undefined,
  intrinsics: Map<string, IntrinsicSize>,
): { w: number; h: number } {
  const pad = parsePadding(node);
  const innerW = Math.max(0, maxW - pad.left - pad.right);
  const innerH =
    maxH === undefined ? undefined : Math.max(0, maxH - pad.top - pad.bottom);
  const children = node.children ?? [];
  const gap = gapFor(node);

  if (children.length === 0) {
    const leaf = leafIntrinsic(node, intrinsics);
    const w = pad.left + pad.right + Math.min(leaf.width, innerW);
    const h = pad.top + pad.bottom + leaf.height;
    return { w: Math.min(maxW, w), h };
  }

  if (isRow(node)) {
    const dims = children.map((c) =>
      measureNode(c, innerW, innerH, intrinsics),
    );
    let totalW = 0;
    let rowH = 0;
    for (let i = 0; i < dims.length; i++) {
      totalW += dims[i].w;
      if (i < dims.length - 1) totalW += gap;
      rowH = Math.max(rowH, dims[i].h);
    }
    if (innerH !== undefined) {
      rowH = Math.min(rowH, innerH);
    }
    return {
      w: pad.left + pad.right + totalW,
      h: pad.top + pad.bottom + rowH,
    };
  }

  let totalH = pad.top + pad.bottom;
  for (let i = 0; i < children.length; i++) {
    const m = measureNode(children[i], innerW, undefined, intrinsics);
    totalH += m.h;
    if (i < children.length - 1) totalH += gap;
  }
  return { w: maxW, h: totalH };
}

function layoutSubtree(
  node: UiNode,
  x: number,
  y: number,
  width: number,
  maxHeight: number | undefined,
  map: Map<string, Rect>,
  intrinsics: Map<string, IntrinsicSize>,
): Rect {
  const pad = parsePadding(node);
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH =
    maxHeight === undefined
      ? undefined
      : Math.max(0, maxHeight - pad.top - pad.bottom);
  const children = node.children ?? [];
  const gap = gapFor(node);

  if (children.length === 0) {
    const leaf = leafIntrinsic(node, intrinsics);
    const w = Math.min(
      width,
      pad.left + pad.right + Math.min(leaf.width, innerW),
    );
    const h = pad.top + pad.bottom + leaf.height;
    const r = { x, y, width: w, height: h };
    map.set(node.id, r);
    return r;
  }

  if (isRow(node)) {
    const dims = children.map((c) =>
      measureNode(c, innerW, innerH, intrinsics),
    );
    let rowH = Math.max(...dims.map((d) => d.h), 0);
    if (innerH !== undefined) {
      rowH = Math.min(rowH, innerH);
    }
    let cx = x + pad.left;
    for (let i = 0; i < children.length; i++) {
      const dy = y + pad.top + (rowH - dims[i].h) / 2;
      layoutSubtree(
        children[i],
        cx,
        dy,
        dims[i].w,
        rowH,
        map,
        intrinsics,
      );
      cx += dims[i].w;
      if (i < children.length - 1) cx += gap;
    }
    const rectW = cx - x + pad.right;
    const rectH = pad.top + rowH + pad.bottom;
    const r = { x, y, width: rectW, height: rectH };
    map.set(node.id, r);
    return r;
  }

  let cy = y + pad.top;
  for (let i = 0; i < children.length; i++) {
    const r = layoutSubtree(
      children[i],
      x + pad.left,
      cy,
      innerW,
      undefined,
      map,
      intrinsics,
    );
    cy += r.height + gap;
  }
  cy -= gap;
  const rectH = cy - y + pad.bottom;
  const r = { x, y, width, height: rectH };
  map.set(node.id, r);
  return r;
}

/**
 * Deterministic layout: `Map<nodeId, Rect>` in root coordinates (root top-left at 0,0).
 * Supports **Box** (column, gap 0) and **Stack** (row/column + gap); other types with
 * children are laid out as columns.
 */
export function layoutDocument(
  root: UiNode,
  constraints: LayoutConstraints,
  options?: LayoutOptions,
): Map<string, Rect> {
  const map = new Map<string, Rect>();
  const intrinsics = options?.intrinsics ?? new Map<string, IntrinsicSize>();
  layoutSubtree(
    root,
    0,
    0,
    Math.max(1, constraints.width),
    constraints.maxHeight,
    map,
    intrinsics,
  );
  return map;
}
