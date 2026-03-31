"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getDefinition } from "@aiui/registry";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasDropData, CanvasSiblingData } from "./dnd-types";
import { useEffect, useRef, useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";

type BuilderCanvasProps = {
  root: UiNode;
  rootId: string;
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

export function BuilderCanvas(props: BuilderCanvasProps) {
  const { root, rootId, selectedId, onSelect, onLabelChange } = props;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Canvas
      </p>
      <p className="text-[0.65rem] leading-snug text-muted-foreground">
        Drag the grip to reorder siblings. Drop components from the palette on a
        node to nest.
      </p>
      <div
        role="presentation"
        className="min-h-[220px] rounded-xl border border-dashed border-border bg-muted/15 p-3 transition-colors hover:bg-muted/25"
        onClick={() => onSelect(null)}
      >
        <CanvasNode
          node={root}
          rootId={rootId}
          parentId={null}
          selectedId={selectedId}
          onSelect={onSelect}
          onLabelChange={onLabelChange}
          depth={0}
        />
      </div>
    </div>
  );
}

function SortableCanvasShell(props: {
  id: string;
  parentId: string;
  children: (args: {
    attributes: DraggableAttributes;
    listeners: Record<string, unknown> | undefined;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: props.id,
      data: {
        kind: "canvas-sibling",
        parentId: props.parentId,
      } satisfies CanvasSiblingData,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-80")}
    >
      {props.children({ attributes, listeners })}
    </div>
  );
}

type CanvasNodeProps = {
  node: UiNode;
  rootId: string;
  parentId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLabelChange: (id: string, label: string) => void;
  depth: number;
};

function CanvasNode(props: CanvasNodeProps) {
  const { node, rootId, parentId, selectedId, onSelect, onLabelChange, depth } =
    props;

  if (parentId !== null) {
    return (
      <SortableCanvasShell id={node.id} parentId={parentId}>
        {({ attributes, listeners }) => (
          <CanvasNodeInner
            node={node}
            rootId={rootId}
            parentId={parentId}
            selectedId={selectedId}
            onSelect={onSelect}
            onLabelChange={onLabelChange}
            depth={depth}
            sortable={{ attributes, listeners }}
          />
        )}
      </SortableCanvasShell>
    );
  }

  return (
    <CanvasNodeInner
      node={node}
      rootId={rootId}
      parentId={null}
      selectedId={selectedId}
      onSelect={onSelect}
      onLabelChange={onLabelChange}
      depth={depth}
      sortable={null}
    />
  );
}

type CanvasNodeInnerProps = CanvasNodeProps & {
  sortable: {
    attributes: DraggableAttributes;
    listeners: Record<string, unknown> | undefined;
  } | null;
};

function CanvasNodeInner(props: CanvasNodeInnerProps) {
  const {
    node,
    rootId,
    parentId,
    selectedId,
    onSelect,
    onLabelChange,
    depth,
    sortable,
  } = props;

  const isRoot = node.id === rootId;
  const isSelected = selectedId === node.id;
  const [editingLabel, setEditingLabel] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelEditRef = useRef(false);

  const { setNodeRef, isOver, active } = useDroppable({
    id: `drop-${node.id}`,
    data: {
      parentId: node.id,
      depth,
    } satisfies CanvasDropData,
  });

  const isPaletteDrag =
    active?.data.current &&
    typeof active.data.current === "object" &&
    (active.data.current as { kind?: string }).kind === "palette";

  const labelText = readLabelProp(node);
  const typeTitle = nodeTypeTitle(node);

  useEffect(() => {
    if (!editingLabel) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editingLabel]);

  useEffect(() => {
    if (selectedId !== node.id && editingLabel) {
      setEditingLabel(false);
    }
  }, [selectedId, node.id, editingLabel]);

  function commitLabel(raw: string) {
    onLabelChange(node.id, raw.trim());
    setEditingLabel(false);
    cancelEditRef.current = false;
  }

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${typeTitle}${labelText ? `, ${labelText}` : ""}`}
      data-selected={isSelected ? "true" : "false"}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={cn(
        "group w-full cursor-pointer rounded-lg border px-2.5 py-2 text-left outline-none transition-[box-shadow,background-color,border-color]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isRoot ? "border-primary/35 bg-background/90" : "border-border bg-card",
        isSelected &&
          "ring-2 ring-ring ring-offset-2 ring-offset-background",
        !isSelected &&
          "hover:border-primary/45 hover:bg-muted/40 hover:shadow-sm",
        isOver && isPaletteDrag && "border-primary bg-primary/8 shadow-sm",
      )}
      style={{
        marginLeft: depth > 0 ? Math.min(depth * 10, 48) : 0,
      }}
    >
      <div className="flex gap-1">
        {sortable ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            title="Drag to reorder"
            aria-label="Drag to reorder sibling"
            onClick={(e) => e.stopPropagation()}
            {...sortable.listeners}
            {...sortable.attributes}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : (
          <span className="mt-0.5 w-5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-foreground">
              {typeTitle}
            </span>
            {editingLabel ? (
              <input
                ref={inputRef}
                type="text"
                className="min-w-32 flex-1 rounded border border-input bg-background px-2 py-0.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={labelText}
                placeholder="Layer label…"
                aria-label="Layer label"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitLabel((e.target as HTMLInputElement).value);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditRef.current = true;
                    setEditingLabel(false);
                  }
                }}
                onBlur={(e) => {
                  if (cancelEditRef.current) {
                    cancelEditRef.current = false;
                    return;
                  }
                  commitLabel((e.target as HTMLInputElement).value);
                }}
              />
            ) : (
              <button
                type="button"
                className={cn(
                  "max-w-full truncate rounded px-1 py-0 text-left text-sm transition-colors",
                  labelText
                    ? "text-foreground/90"
                    : "text-muted-foreground/80 italic",
                )}
                title="Double-click to edit label"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.id);
                  setEditingLabel(true);
                }}
              >
                {labelText || "Add label…"}
              </button>
            )}
            <span
              className="ml-auto font-mono text-[0.65rem] text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100"
              title={node.id}
            >
              {node.id.slice(0, 8)}…
            </span>
            {isRoot ? (
              <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                Root
              </span>
            ) : null}
          </div>
          {node.children?.length ? (
            <div
              className={cn(
                "mt-2 space-y-2 border-l-2 border-border/80 pl-3",
                depth > 0 && "border-primary/15",
              )}
            >
              <SortableContext
                items={node.children.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {node.children.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    rootId={rootId}
                    parentId={node.id}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onLabelChange={onLabelChange}
                    depth={depth + 1}
                  />
                ))}
              </SortableContext>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground/90">
              Drop a component here to add a child
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
