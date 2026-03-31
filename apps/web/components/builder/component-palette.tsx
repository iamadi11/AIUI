"use client";

import { useDraggable } from "@dnd-kit/core";
import { BoxIcon, LayersIcon, Search } from "lucide-react";
import type { ComponentDefinition } from "@aiui/registry";
import {
  BOX_TYPE,
  PALETTE_CATEGORY_LABELS,
  PALETTE_CATEGORY_ORDER,
  STACK_TYPE,
  listPaletteDefinitions,
  matchesPaletteSearch,
  type PaletteCategory,
} from "@aiui/registry";
import { cn } from "@/lib/utils";
import type { PaletteDragData } from "./dnd-types";
import { useMemo, useState } from "react";

const iconForType: Partial<Record<string, typeof BoxIcon>> = {
  [BOX_TYPE]: BoxIcon,
  [STACK_TYPE]: LayersIcon,
};

const searchInputClass =
  "w-full rounded-md border border-input bg-background pl-8 pr-2 py-1.5 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

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
      title={`${definition.displayName} (${definition.type}) — drag onto the canvas`}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left shadow-sm transition-colors",
        "hover:border-primary/45 hover:bg-muted/45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "cursor-grabbing opacity-60",
        !isDragging && "cursor-grab active:cursor-grabbing",
      )}
    >
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-card-foreground">
          {definition.displayName}
        </span>
        {definition.paletteDescription ? (
          <span className="mt-0.5 block truncate text-[0.65rem] leading-tight text-muted-foreground">
            {definition.paletteDescription}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function groupByCategory(
  defs: ComponentDefinition[],
): Map<PaletteCategory, ComponentDefinition[]> {
  const map = new Map<PaletteCategory, ComponentDefinition[]>();
  for (const cat of PALETTE_CATEGORY_ORDER) {
    map.set(cat, []);
  }
  for (const def of defs) {
    const list = map.get(def.paletteCategory);
    if (list) list.push(def);
  }
  return map;
}

export function ComponentPalette() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const all = listPaletteDefinitions();
    return all.filter((d) => matchesPaletteSearch(d, query));
  }, [query]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  const hasAnyMatch = filtered.length > 0;
  const queryActive = query.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Components
        </p>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            className={searchInputClass}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search components"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
        {!hasAnyMatch ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-2 py-4 text-center text-xs text-muted-foreground leading-relaxed">
            {queryActive
              ? "No components match your search. Try another word or clear the filter."
              : "No components registered."}
          </p>
        ) : (
          PALETTE_CATEGORY_ORDER.map((category) => {
            const items = grouped.get(category) ?? [];
            if (items.length === 0) {
              if (queryActive) return null;
              return (
                <section key={category} aria-labelledby={`palette-cat-${category}`}>
                  <h3
                    id={`palette-cat-${category}`}
                    className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {PALETTE_CATEGORY_LABELS[category]}
                  </h3>
                  <p className="rounded-md border border-border/60 bg-muted/15 px-2 py-2 text-[0.65rem] leading-snug text-muted-foreground">
                    Nothing here yet — primitives in this group will appear when
                    added to the registry.
                  </p>
                </section>
              );
            }
            return (
              <section key={category} aria-labelledby={`palette-cat-${category}`}>
                <h3
                  id={`palette-cat-${category}`}
                  className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {PALETTE_CATEGORY_LABELS[category]}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {items.map((def) => (
                    <PaletteItem key={def.type} definition={def} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
        Drag onto the canvas. Drop on a node to nest a child; use the canvas
        background to append under the root.
      </p>
    </div>
  );
}
