"use client";

import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import type { RuntimeDiagnostic } from "@aiui/runtime-core";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  layoutDocument,
  parsePadding,
  type Rect,
} from "@aiui/layout-engine";
import { getDefinition } from "@aiui/registry";
import { GripVertical } from "lucide-react";
import { findNodeById } from "@/lib/document/tree";
import { cn } from "@/lib/utils";
import { RuntimeSurface } from "@/components/runtime/runtime-surface";
import type { CanvasDropData, CanvasSiblingData } from "./dnd-types";
import { DRAG_COPY } from "./drag-copy";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const MIN_LEAF_PX = 32;
const SNAP_PX = 8;

function snapLayoutSize(n: number): number {
  return Math.max(MIN_LEAF_PX, Math.round(n / SNAP_PX) * SNAP_PX);
}

function isLeafNode(node: UiNode): boolean {
  return !node.children?.length;
}

type BuilderCanvasProps = {
  document: AiuiDocument;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToggleSelect?: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
  /** Set intrinsic `layout.width` / `layout.height` for empty leaves (snapped to 8px, min 32). */
  onLeafLayoutResize?: (id: string, width: number, height: number) => void;
  onRuntimeDiagnostic?: (diagnostic: RuntimeDiagnostic) => void;
};

function readLabelProp(node: UiNode): string {
  const raw = node.props.label;
  return typeof raw === "string" ? raw : "";
}

function nodeTypeTitle(node: UiNode): string {
  return getDefinition(node.type)?.displayName ?? node.type;
}

function collectDepths(root: UiNode): Map<string, number> {
  const m = new Map<string, number>();
  function walk(n: UiNode, d: number) {
    m.set(n.id, d);
    for (const c of n.children ?? []) walk(c, d + 1);
  }
  walk(root, 0);
  return m;
}

function collectSortableGroups(
  root: UiNode,
): { parentId: string; childIds: string[] }[] {
  const out: { parentId: string; childIds: string[] }[] = [];
  function walk(n: UiNode) {
    const kids = n.children ?? [];
    if (kids.length > 0) {
      out.push({ parentId: n.id, childIds: kids.map((c) => c.id) });
      for (const c of kids) walk(c);
    }
  }
  walk(root);
  return out;
}

function PaletteDropOverlay(props: {
  nodeId: string;
  depth: number;
  rect: Rect;
  pointerEventsOn: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${props.nodeId}`,
    data: {
      parentId: props.nodeId,
      depth: props.depth,
    } satisfies CanvasDropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute rounded-md transition-colors",
        isOver && props.pointerEventsOn && "bg-primary/10 ring-1 ring-primary/35",
      )}
      style={{
        left: props.rect.x,
        top: props.rect.y,
        width: props.rect.width,
        height: props.rect.height,
        pointerEvents: props.pointerEventsOn ? "auto" : "none",
        zIndex: props.pointerEventsOn ? 8 : 0,
      }}
    >
      {isOver && props.pointerEventsOn ? (
        <span className="pointer-events-none absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[0.62rem] font-medium text-primary-foreground shadow-sm">
          {DRAG_COPY.dropInsideLabel}
        </span>
      ) : null}
    </div>
  );
}

function SortableGrip(props: {
  nodeId: string;
  parentId: string;
  rect: Rect;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: props.nodeId,
      data: {
        kind: "canvas-sibling",
        parentId: props.parentId,
      } satisfies CanvasSiblingData,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 20,
  };

  return (
    <div
      ref={setNodeRef}
      className="absolute"
      style={{
        left: props.rect.x,
        top: props.rect.y,
        width: 0,
        height: 0,
        ...style,
      }}
    >
      <button
        type="button"
        data-aiui-grip
        className="nodrag nopan -ml-0.5 -mt-0.5 flex cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        title={DRAG_COPY.reorderTitle}
        aria-label="Drag to reorder sibling"
        onClick={(e) => e.stopPropagation()}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function SelectionChrome(props: {
  rect: Rect;
  title: string;
  labelText: string;
  editing: boolean;
  onStartEdit: () => void;
  onCommit: (value: string) => void;
  onCancelEdit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  useLayoutEffect(() => {
    if (!props.editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [props.editing]);

  return (
    <div
      className="pointer-events-none absolute rounded-md ring-2 ring-ring ring-offset-2 ring-offset-background"
      style={{
        left: props.rect.x,
        top: props.rect.y,
        width: props.rect.width,
        height: props.rect.height,
        zIndex: 15,
      }}
    >
      <div
        data-aiui-builder-chrome
        className="pointer-events-auto absolute left-1 top-1 flex max-w-[calc(100%-8px)] flex-wrap items-center gap-1 rounded border border-border/80 bg-background/95 px-1.5 py-0.5 text-xs shadow-sm"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="shrink-0 font-medium text-foreground">{props.title}</span>
        {props.editing ? (
          <input
            ref={inputRef}
            type="text"
            className="min-w-24 max-w-full rounded border border-input bg-background px-1 py-0.5 text-xs text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={props.labelText}
            placeholder="Label…"
            aria-label="Layer label"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                props.onCommit((e.target as HTMLInputElement).value);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelRef.current = true;
                props.onCancelEdit();
              }
            }}
            onBlur={(e) => {
              if (cancelRef.current) {
                cancelRef.current = false;
                return;
              }
              props.onCommit((e.target as HTMLInputElement).value);
            }}
          />
        ) : (
          <button
            type="button"
            className={cn(
              "max-w-full truncate rounded px-1 py-0 text-left text-xs transition-colors",
              props.labelText
                ? "text-foreground/90"
                : "text-muted-foreground/80 italic",
            )}
            title="Double-click to edit label"
            onDoubleClick={(e) => {
              e.preventDefault();
              props.onStartEdit();
            }}
          >
            {props.labelText || "Add label…"}
          </button>
        )}
      </div>
    </div>
  );
}

export function BuilderCanvas(props: BuilderCanvasProps) {
  const {
    document,
    selectedId,
    onSelect,
    onToggleSelect,
    onLabelChange,
    onLeafLayoutResize,
    onRuntimeDiagnostic,
  } = props;
  const root = document.root;

  const measureRef = useRef<HTMLDivElement>(null);
  const onLeafLayoutResizeRef = useRef(onLeafLayoutResize);
  useLayoutEffect(() => {
    onLeafLayoutResizeRef.current = onLeafLayoutResize;
  });

  const [layoutWidth, setLayoutWidth] = useState(0);
  const [paletteDropActive, setPaletteDropActive] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [resizeSession, setResizeSession] = useState<null | {
    id: string;
    startX: number;
    startY: number;
    baseW: number;
    baseH: number;
    padX: number;
    padY: number;
    candidateWidths: number[];
    candidateHeights: number[];
  }>(null);
  const [resizeDraft, setResizeDraft] = useState<null | {
    id: string;
    w: number;
    h: number;
  }>(null);

  useDndMonitor({
    onDragStart: (e) => {
      const k = (e.active.data.current as { kind?: string } | undefined)?.kind;
      if (k === "palette") setPaletteDropActive(true);
    },
    onDragEnd: () => setPaletteDropActive(false),
    onDragCancel: () => setPaletteDropActive(false),
  });

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setLayoutWidth(el.clientWidth);
    });
    ro.observe(el);
    setLayoutWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const rects = useMemo(() => {
    const w = layoutWidth > 0 ? layoutWidth : 320;
    return layoutDocument(root, { width: w });
  }, [root, layoutWidth]);

  const depths = useMemo(() => collectDepths(root), [root]);
  const sortableGroups = useMemo(() => collectSortableGroups(root), [root]);

  const selectedRect =
    selectedId && rects.has(selectedId) ? rects.get(selectedId)! : null;
  const selectedNode =
    selectedId && selectedRect ? findNodeById(root, selectedId) : null;

  const effectiveSelectedRect = useMemo(() => {
    if (!selectedRect || !selectedNode || !resizeDraft) return selectedRect;
    if (resizeDraft.id !== selectedId) return selectedRect;
    const pad = parsePadding(selectedNode);
    return {
      ...selectedRect,
      width: pad.left + pad.right + resizeDraft.w,
      height: pad.top + pad.bottom + resizeDraft.h,
    };
  }, [selectedRect, selectedNode, resizeDraft, selectedId]);

  const alignmentGuides = useMemo(() => {
    if (!resizeDraft || !selectedRect || !selectedNode) {
      return { x: null as number | null, y: null as number | null };
    }
    if (!isLeafNode(selectedNode) || resizeDraft.id !== selectedId) {
      return { x: null as number | null, y: null as number | null };
    }
    if (!effectiveSelectedRect) {
      return { x: null as number | null, y: null as number | null };
    }

    const threshold = 4; // px
    const selLeft = effectiveSelectedRect.x;
    const selRight = effectiveSelectedRect.x + effectiveSelectedRect.width;
    const selTop = effectiveSelectedRect.y;
    const selBottom =
      effectiveSelectedRect.y + effectiveSelectedRect.height;

    let bestX: { x: number; d: number } | null = null;
    let bestY: { y: number; d: number } | null = null;

    for (const [id, r] of rects) {
      if (id === selectedId) continue;
      const otherLeft = r.x;
      const otherRight = r.x + r.width;
      const otherTop = r.y;
      const otherBottom = r.y + r.height;

      const candidatesX = [
        { x: otherLeft, d: Math.abs(selRight - otherLeft) },
        { x: otherRight, d: Math.abs(selRight - otherRight) },
        { x: otherLeft, d: Math.abs(selLeft - otherLeft) },
        { x: otherRight, d: Math.abs(selLeft - otherRight) },
      ];
      for (const c of candidatesX) {
        if (!bestX || c.d < bestX.d) bestX = c;
      }

      const candidatesY = [
        { y: otherTop, d: Math.abs(selBottom - otherTop) },
        { y: otherBottom, d: Math.abs(selBottom - otherBottom) },
        { y: otherTop, d: Math.abs(selTop - otherTop) },
        { y: otherBottom, d: Math.abs(selTop - otherBottom) },
      ];
      for (const c of candidatesY) {
        if (!bestY || c.d < bestY.d) bestY = c;
      }
    }

    return {
      x: bestX && bestX.d <= threshold ? bestX.x : null,
      y: bestY && bestY.d <= threshold ? bestY.y : null,
    };
  }, [resizeDraft, selectedRect, selectedNode, selectedId, rects, effectiveSelectedRect]);

  useEffect(() => {
    if (resizeSession === null) return;
    const {
      id,
      startX,
      startY,
      baseW,
      baseH,
      candidateWidths,
      candidateHeights,
    } = resizeSession;

    function computeSnappedSize(
      dx: number,
      dy: number,
    ): { w: number; h: number } {
      const rawW = baseW + dx;
      const rawH = baseH + dy;

      let w = snapLayoutSize(rawW);
      let h = snapLayoutSize(rawH);

      const threshold = SNAP_PX; // px within which to snap to sibling edges

      if (candidateWidths.length > 0) {
        let best = { value: w, dist: Number.POSITIVE_INFINITY };
        for (const cw of candidateWidths) {
          const dist = Math.abs(rawW - cw);
          if (dist < best.dist) {
            best = { value: cw, dist };
          }
        }
        if (best.dist <= threshold) {
          w = Math.max(MIN_LEAF_PX, best.value);
        }
      }

      if (candidateHeights.length > 0) {
        let best = { value: h, dist: Number.POSITIVE_INFINITY };
        for (const ch of candidateHeights) {
          const dist = Math.abs(rawH - ch);
          if (dist < best.dist) {
            best = { value: ch, dist };
          }
        }
        if (best.dist <= threshold) {
          h = Math.max(MIN_LEAF_PX, best.value);
        }
      }

      return { w, h };
    }

    function move(e: PointerEvent) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const { w, h } = computeSnappedSize(dx, dy);
      setResizeDraft({
        id,
        w,
        h,
      });
    }
    function up(e: PointerEvent) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const { w, h } = computeSnappedSize(dx, dy);
      onLeafLayoutResizeRef.current?.(id, w, h);
      setResizeSession(null);
      setResizeDraft(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [resizeSession]);

  function handlePointerDownCapture(e: React.PointerEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest("[data-aiui-resize-handle]")) return;
    if (t.closest("[data-aiui-builder-chrome]")) return;
    if (t.closest("[data-aiui-grip]")) return;
    const hit = t.closest("[data-aiui-id]");
    const id = hit?.getAttribute("data-aiui-id");
    const isToggle = e.metaKey || e.ctrlKey;
    if (id) {
      if (isToggle && onToggleSelect) {
        onToggleSelect(id);
      } else {
        onSelect(id);
      }
      return;
    }
    if (!isToggle) {
      onSelect(null);
    }
  }

  function handleDoubleClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const hit = t.closest("[data-aiui-id]");
    const id = hit?.getAttribute("data-aiui-id");
    if (!id) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
    setEditingLabelId(id);
  }

  const nodeIds = useMemo(() => {
    const ids: string[] = [];
    function walk(n: UiNode) {
      ids.push(n.id);
      for (const c of n.children ?? []) walk(c);
    }
    walk(root);
    return ids;
  }, [root]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Canvas
      </p>
      <p className="text-[0.65rem] leading-snug text-muted-foreground">
        {DRAG_COPY.canvasHint}
      </p>
      <div
        className="rounded-xl border border-dashed border-border bg-muted/15 p-3 transition-colors hover:bg-muted/25"
        onPointerDownCapture={handlePointerDownCapture}
        onDoubleClickCapture={handleDoubleClickCapture}
      >
        <div ref={measureRef} className="relative w-full min-h-[220px]">
          <RuntimeSurface
            document={document}
            diagnostics={onRuntimeDiagnostic}
            className="min-h-[200px] w-full rounded-lg border border-border/60 bg-background/40"
          />

          <div className="pointer-events-none absolute inset-0">
            {nodeIds.map((id) => {
              const r = rects.get(id);
              if (!r) return null;
              return (
                <PaletteDropOverlay
                  key={`drop-${id}`}
                  nodeId={id}
                  depth={depths.get(id) ?? 0}
                  rect={r}
                  pointerEventsOn={paletteDropActive}
                />
              );
            })}

            {sortableGroups.map((g) => (
              <SortableContext
                key={g.parentId}
                items={g.childIds}
                strategy={verticalListSortingStrategy}
              >
                {g.childIds.map((id) => {
                  const r = rects.get(id);
                  if (!r) return null;
                  return (
                    <SortableGrip
                      key={`grip-${id}`}
                      nodeId={id}
                      parentId={g.parentId}
                      rect={r}
                    />
                  );
                })}
              </SortableContext>
            ))}

            {alignmentGuides.x !== null ? (
              <div
                className="absolute z-26 bg-primary/25"
                style={{ left: alignmentGuides.x, top: 0, bottom: 0, width: 1 }}
              />
            ) : null}
            {alignmentGuides.y !== null ? (
              <div
                className="absolute z-26 bg-primary/25"
                style={{ top: alignmentGuides.y, left: 0, right: 0, height: 1 }}
              />
            ) : null}

            {selectedNode && effectiveSelectedRect ? (
              <SelectionChrome
                rect={effectiveSelectedRect}
                title={nodeTypeTitle(selectedNode)}
                labelText={readLabelProp(selectedNode)}
                editing={
                  editingLabelId !== null && editingLabelId === selectedId
                }
                onStartEdit={() => setEditingLabelId(selectedNode.id)}
                onCommit={(value) => {
                  onLabelChange(selectedNode.id, value);
                  setEditingLabelId(null);
                }}
                onCancelEdit={() => setEditingLabelId(null)}
              />
            ) : null}

            {selectedNode &&
            selectedRect &&
            effectiveSelectedRect &&
            onLeafLayoutResize &&
            isLeafNode(selectedNode) ? (
              <button
                type="button"
                data-aiui-resize-handle
                className="nodrag nopan pointer-events-auto absolute size-3 cursor-nwse-resize rounded-sm border border-primary bg-background shadow-md"
                style={{
                  left: effectiveSelectedRect.x + effectiveSelectedRect.width - 5,
                  top: effectiveSelectedRect.y + effectiveSelectedRect.height - 5,
                  zIndex: 22,
                }}
                title="Resize (8px snap, min 32px)"
                aria-label="Resize layer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const pad = parsePadding(selectedNode);
                  const padX = pad.left + pad.right;
                  const padY = pad.top + pad.bottom;
                  const innerW = Math.max(0, selectedRect.width - padX);
                  const innerH = Math.max(0, selectedRect.height - padY);
                  const layout = selectedNode.layout as
                    | Record<string, unknown>
                    | undefined;
                  const baseW =
                    typeof layout?.width === "number" && Number.isFinite(layout.width)
                      ? layout.width
                      : innerW;
                  const baseH =
                    typeof layout?.height === "number" &&
                    Number.isFinite(layout.height)
                      ? layout.height
                      : innerH;

                  const candidateWidths: number[] = [];
                  const candidateHeights: number[] = [];
                  const selectedLeft = selectedRect.x;
                  const selectedTop = selectedRect.y;

                  for (const [otherId, r] of rects) {
                    if (otherId === selectedNode.id) continue;
                    // Horizontal: align right edge with other left/right, or left edge with other left/right
                    const rightToOtherLeft =
                      r.x - selectedLeft - padX; // right edge to other left
                    const rightToOtherRight =
                      r.x + r.width - selectedLeft - padX; // right edge to other right
                    const leftToOtherLeft =
                      r.x - selectedLeft - padX; // left edge to other left (same as rightToOtherLeft)
                    const leftToOtherRight =
                      r.x + r.width - selectedLeft - padX; // left edge to other right

                    for (const w of [
                      rightToOtherLeft,
                      rightToOtherRight,
                      leftToOtherLeft,
                      leftToOtherRight,
                    ]) {
                      if (Number.isFinite(w) && w > 0) {
                        candidateWidths.push(w);
                      }
                    }

                    // Vertical: align bottom edge with other top/bottom, or top edge with other top/bottom
                    const bottomToOtherTop = r.y - selectedTop - padY;
                    const bottomToOtherBottom =
                      r.y + r.height - selectedTop - padY;
                    const topToOtherTop = r.y - selectedTop - padY;
                    const topToOtherBottom =
                      r.y + r.height - selectedTop - padY;

                    for (const h of [
                      bottomToOtherTop,
                      bottomToOtherBottom,
                      topToOtherTop,
                      topToOtherBottom,
                    ]) {
                      if (Number.isFinite(h) && h > 0) {
                        candidateHeights.push(h);
                      }
                    }
                  }

                  setResizeSession({
                    id: selectedNode.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    baseW,
                    baseH,
                    padX,
                    padY,
                    candidateWidths,
                    candidateHeights,
                  });
                  setResizeDraft({
                    id: selectedNode.id,
                    w: snapLayoutSize(baseW),
                    h: snapLayoutSize(baseH),
                  });
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
