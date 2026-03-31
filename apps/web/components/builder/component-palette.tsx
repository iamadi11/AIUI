"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Badge,
  BoxIcon,
  GalleryVerticalEnd,
  LayersIcon,
  Search,
  Table2,
  Type,
} from "lucide-react";
import type { ComponentDefinition } from "@aiui/registry";
import {
  BOX_TYPE,
  BUTTON_TYPE,
  CARD_TYPE,
  INPUT_TYPE,
  PALETTE_CATEGORY_LABELS,
  PALETTE_CATEGORY_ORDER,
  STACK_TYPE,
  TABLE_TYPE,
  BADGE_TYPE,
  listShadcnPaletteDefinitions,
  matchesPaletteSearch,
  type PaletteCategory,
} from "@aiui/registry";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { PaletteDragData } from "./dnd-types";
import { DRAG_COPY } from "./drag-copy";
import { useMemo, useState } from "react";

const iconForType: Partial<Record<string, typeof BoxIcon>> = {
  [BOX_TYPE]: BoxIcon,
  [STACK_TYPE]: LayersIcon,
  [BUTTON_TYPE]: Type,
  [INPUT_TYPE]: Type,
  [CARD_TYPE]: GalleryVerticalEnd,
  [TABLE_TYPE]: Table2,
  [BADGE_TYPE]: Badge,
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
      title={DRAG_COPY.paletteItemTitle(definition.displayName, definition.type)}
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
        {definition.ux.palette.description ? (
          <span className="mt-0.5 block truncate text-[0.65rem] leading-tight text-muted-foreground">
            {definition.ux.palette.description}
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
    const list = map.get(def.ux.palette.category);
    if (list) list.push(def);
  }
  return map;
}

export function ComponentPalette() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const all = listShadcnPaletteDefinitions();
    return all.filter((d) => matchesPaletteSearch(d, query));
  }, [query]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  const categoriesWithItems = useMemo(
    () =>
      PALETTE_CATEGORY_ORDER.filter(
        (cat) => (grouped.get(cat) ?? []).length > 0,
      ),
    [grouped],
  );

  const hasAnyMatch = filtered.length > 0;
  const queryActive = query.trim().length > 0;

  return (
    <section
      className="flex min-h-0 flex-col gap-3"
      aria-labelledby="component-palette-heading"
    >
      <div>
        <p
          id="component-palette-heading"
          className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {msg("palette.shadcnComponents")}
        </p>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            className={searchInputClass}
            placeholder={msg("palette.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={msg("palette.searchAriaLabel")}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
        {!hasAnyMatch ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-2 py-4 text-center text-xs text-muted-foreground leading-relaxed">
            {queryActive
              ? msg("palette.noSearchMatch")
              : msg("palette.noComponentsRegistered")}
          </p>
        ) : (
          categoriesWithItems.map((category) => {
            const items = grouped.get(category) ?? [];
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
        {DRAG_COPY.paletteFooter}
      </p>
      <p className="sr-only" aria-live="polite">
        {hasAnyMatch
          ? filtered.length === 1
            ? msg("palette.componentAvailable")
            : msg("palette.componentsAvailable", { count: filtered.length })
          : msg("palette.noComponentsAvailable")}
      </p>
    </section>
  );
}
