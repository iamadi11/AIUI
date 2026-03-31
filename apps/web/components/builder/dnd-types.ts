export type PaletteDragData = {
  kind: "palette";
  componentType: string;
};

export type CanvasDropData = {
  parentId: string;
  /** Tree depth for collision priority (deeper = preferred when pointers overlap). */
  depth: number;
};

/** Dragging an existing canvas node to reorder among siblings. */
export type CanvasSiblingData = {
  kind: "canvas-sibling";
  parentId: string;
};

export function isPaletteDragData(
  value: unknown,
): value is PaletteDragData {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return o.kind === "palette" && typeof o.componentType === "string";
}

export function isCanvasSiblingData(
  value: unknown,
): value is CanvasSiblingData {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return o.kind === "canvas-sibling" && typeof o.parentId === "string";
}
