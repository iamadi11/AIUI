"use client";

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function formatLabel(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
}

export function KeyValueListWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const entries = Object.entries(data as Record<string, unknown>);
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="rounded-xl border border-border/60 divide-y divide-border/40">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <span className="text-xs font-medium text-muted-foreground min-w-0 shrink-0">
              {formatLabel(k)}
            </span>
            <span className="text-xs text-foreground text-right break-all min-w-0">
              {formatValue(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
