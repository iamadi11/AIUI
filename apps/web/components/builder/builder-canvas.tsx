"use client";

import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { layoutDocument, type Rect } from "@aiui/layout-engine";
import { AiuiRuntime } from "@aiui/runtime-react";
import { getDefinition } from "@aiui/registry";
import { GripVertical } from "lucide-react";
import { findNodeById } from "@/lib/document/tree";
import { cn } from "@/lib/utils";
import type { CanvasDropData, CanvasSiblingData } from "./dnd-types";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

type BuilderCanvasProps = {
  document: AiuiDocument;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLabelChange: (id: string, label: string) => void;
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
    />
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
        title="Drag to reorder"
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
  const { document, selectedId, onSelect, onLabelChange } = props;
  const root = document.root;

  const measureRef = useRef<HTMLDivElement>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [paletteDropActive, setPaletteDropActive] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

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

  function handlePointerDownCapture(e: React.PointerEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest("[data-aiui-builder-chrome]")) return;
    if (t.closest("[data-aiui-grip]")) return;
    const hit = t.closest("[data-aiui-id]");
    const id = hit?.getAttribute("data-aiui-id");
    if (id) {
      onSelect(id);
      return;
    }
    onSelect(null);
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
        Same <code className="font-mono text-[0.65rem]">@aiui/runtime-core</code>{" "}
        view as Preview — click a layer to select; drag the grip to reorder
        siblings; drop palette items onto a highlighted region.
      </p>
      <div
        className="rounded-xl border border-dashed border-border bg-muted/15 p-3 transition-colors hover:bg-muted/25"
        onPointerDownCapture={handlePointerDownCapture}
        onDoubleClickCapture={handleDoubleClickCapture}
      >
        <div ref={measureRef} className="relative w-full min-h-[220px]">
          <AiuiRuntime
            document={document}
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

            {selectedNode && selectedRect ? (
              <SelectionChrome
                rect={selectedRect}
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
          </div>
        </div>
      </div>
    </div>
  );
}
