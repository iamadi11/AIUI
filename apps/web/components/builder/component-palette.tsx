"use client";

import { useDraggable } from "@dnd-kit/core";
import { BoxIcon, LayersIcon } from "lucide-react";
import type { ComponentDefinition } from "@aiui/registry";
import { BOX_TYPE, STACK_TYPE, primitives } from "@aiui/registry";
import { cn } from "@/lib/utils";
import type { PaletteDragData } from "./dnd-types";

const PALETTE_ORDER: string[] = [BOX_TYPE, STACK_TYPE];

const iconForType: Partial<Record<string, typeof BoxIcon>> = {
  [BOX_TYPE]: BoxIcon,
  [STACK_TYPE]: LayersIcon,
};

function PaletteItem(props: { definition: ComponentDefinition }) {
  const { definition } = props;
  const Icon = iconForType[definition.type] ?? BoxIcon;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${definition.type}`,
      data: {
        kind: "palette",
        componentType: definition.type,
      } satisfies PaletteDragData,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-medium text-card-foreground shadow-sm transition-colors",
        "hover:border-primary/40 hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "cursor-grabbing opacity-60",
        !isDragging && "cursor-grab active:cursor-grabbing",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span>{definition.displayName}</span>
      <span className="ml-auto font-mono text-xs text-muted-foreground">
        {definition.type}
      </span>
    </button>
  );
}

export function ComponentPalette() {
  const ordered: ComponentDefinition[] = PALETTE_ORDER.map(
    (type) => primitives[type],
  ).filter(Boolean);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Components
      </p>
      <div className="flex flex-col gap-2">
        {ordered.map((def) => (
          <PaletteItem key={def.type} definition={def} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Drag onto the canvas. Drop on a node to add a child; drop on the empty
        root area to append under the root.
      </p>
    </div>
  );
}
