export const DRAG_COPY = {
  paletteItemTitle: (displayName: string, type: string) =>
    `${displayName} (${type}) - drag to add`,
  paletteFooter:
    "Drag to add. Drop on a layer to nest inside it, or drop on empty canvas to add under root.",
  canvasHint:
    "Runtime-parity canvas. Drag from Components to add; drop on a layer to nest. Use grip handles to reorder siblings.",
  dropInsideLabel: "Drop to nest here",
  reorderTitle: "Drag to reorder siblings",
  overlayPrefix: "Adding",
} as const;
