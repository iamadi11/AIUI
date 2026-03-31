"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { CanvasDropData } from "./dnd-types";

type BuilderCanvasProps = {
  root: UiNode;
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function BuilderCanvas(props: BuilderCanvasProps) {
  const { root, rootId, selectedId, onSelect } = props;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Canvas
      </p>
      <div className="min-h-[220px] rounded-xl border border-dashed border-border bg-muted/20 p-3">
        <CanvasNode
          node={root}
          rootId={rootId}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      </div>
    </div>
  );
}

function CanvasNode(props: {
  node: UiNode;
  rootId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  depth: number;
}) {
  const { node, rootId, selectedId, onSelect, depth } = props;
  const isRoot = node.id === rootId;

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

  return (
    <div className="space-y-2">
      <div
        ref={setNodeRef}
        role="presentation"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        className={cn(
          "w-full cursor-pointer rounded-lg border px-2 py-2 text-left transition-colors",
          isRoot ? "border-primary/30 bg-background/80" : "border-border bg-card",
          selectedId === node.id && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          isOver && isPaletteDrag && "border-primary bg-primary/5",
        )}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-sm font-medium text-foreground">
            {node.type}
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {node.id}
          </span>
          {isRoot ? (
            <span className="text-xs text-muted-foreground">(root)</span>
          ) : null}
        </div>
        {node.children?.length ? (
          <div className="mt-2 space-y-2 border-l border-border pl-3">
            {node.children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                rootId={rootId}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Drop here to add a child
          </p>
        )}
      </div>
    </div>
  );
}
