"use client";

import { useState } from "react";

function NodeView({
  name,
  value,
  depth,
}: {
  name: string;
  value: unknown;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isObj =
    value !== null && typeof value === "object" && !Array.isArray(value);
  const isArr = Array.isArray(value);
  if (!isObj && !isArr) {
    return (
      <div className="flex gap-2 py-0.5 text-xs" style={{ paddingLeft: depth * 16 }}>
        <span className="font-medium text-muted-foreground shrink-0">{name}</span>
        <span className="text-foreground break-all">{formatLeaf(value)}</span>
      </div>
    );
  }
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <button
        type="button"
        className="flex items-center gap-1.5 py-0.5 text-xs hover:text-foreground transition-colors w-full text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`text-[10px] text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
        <span className="font-medium">{name}</span>
        <span className="text-[10px] text-muted-foreground/60">
          {isArr ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`}
        </span>
      </button>
      {open && (
        <div className="ml-2 border-l border-border/40">
          {isArr
            ? (value as unknown[]).map((v, i) => (
                <NodeView key={i} name={`${i}`} value={v} depth={depth + 1} />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <NodeView key={k} name={k} value={v} depth={depth + 1} />
              ))}
        </div>
      )}
    </div>
  );
}

function formatLeaf(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}

export function TreePanelWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  if (data === null || typeof data !== "object") return null;
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="max-h-[480px] overflow-auto rounded-xl border border-border/60 p-3">
        <NodeView name="root" value={data} depth={0} />
      </div>
    </div>
  );
}
