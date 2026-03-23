"use client";

function formatLabel(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
}

function renderValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-muted-foreground/50">—</span>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return <span className="tabular-nums">{v.toLocaleString()}</span>;
  if (typeof v === "string") {
    if (/^https?:\/\//.test(v)) {
      return (
        <a href={v} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
          {v}
        </a>
      );
    }
    return v;
  }
  if (typeof v === "object") {
    return (
      <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted/30 p-1.5 text-[10px] leading-relaxed">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  return String(v);
}

export function PropertyCardWidget({
  data,
  title,
  onCardClick,
}: {
  data: unknown;
  title?: string;
  onCardClick?: () => void;
}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return (
      <div className="rounded-xl border border-border/60 p-4">
        {title && <h3 className="mb-3 text-sm font-semibold tracking-tight">{title}</h3>}
        <pre className="max-h-64 overflow-auto text-[11px] text-muted-foreground">{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);

  return (
    <div
      className="rounded-xl border border-border/60 transition-colors hover:border-border"
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={() => onCardClick?.()}
      onKeyDown={(e) => {
        if (onCardClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCardClick();
        }
      }}
    >
      {title && (
        <div className="border-b border-border/40 px-4 py-3">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
      )}
      <div className="divide-y divide-border/30 px-4">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground shrink-0">{formatLabel(k)}</span>
            <span className="text-xs text-foreground text-right min-w-0 break-words">{renderValue(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
