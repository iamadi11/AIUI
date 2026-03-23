"use client";

import { useState } from "react";

function getItemTitle(item: Record<string, unknown>, index: number): string {
  for (const key of ["name", "title", "label", "id", "username", "email"]) {
    if (typeof item[key] === "string" && item[key]) return item[key] as string;
  }
  return `Item ${index + 1}`;
}

function getItemSubtitle(item: Record<string, unknown>): string | null {
  for (const key of ["description", "email", "type", "category", "status"]) {
    if (typeof item[key] === "string" && item[key]) return item[key] as string;
  }
  return null;
}

export function CardGridWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!Array.isArray(data)) return null;
  const items = data.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const isSelected = selected === i;
          const sub = getItemSubtitle(item);
          return (
            <div
              key={i}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-ring bg-accent/5 shadow-sm"
                  : "border-border/60 hover:border-border hover:bg-muted/20"
              }`}
              onClick={() => setSelected(isSelected ? null : i)}
            >
              <p className="text-sm font-medium truncate">{getItemTitle(item, i)}</p>
              {sub && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(item)
                  .filter(([, v]) => typeof v === "number")
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <span key={k} className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                      {k}: {(v as number).toLocaleString()}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected !== null && (
        <pre className="max-h-40 overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {JSON.stringify(items[selected], null, 2)}
        </pre>
      )}
    </div>
  );
}
