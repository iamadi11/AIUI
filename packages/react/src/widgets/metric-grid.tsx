"use client";

export function MetricGridWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;
  const metrics = Object.entries(obj).filter(
    ([, v]) => typeof v === "number" && Number.isFinite(v),
  ) as [string, number][];
  if (!metrics.length) return null;

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map(([k, v]) => (
          <div
            key={k}
            className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/30"
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {formatLabel(k)}
            </div>
            <div className="mt-1.5 text-xl font-bold tabular-nums tracking-tight">
              {formatMetric(v)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
}

function formatMetric(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 10_000) return (v / 1_000).toFixed(1) + "K";
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
