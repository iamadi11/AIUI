"use client";

export function BulletListWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  if (!Array.isArray(data) || !data.every((x) => typeof x === "string")) {
    return null;
  }
  const items = data as string[];
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="rounded-xl border border-border/60 divide-y divide-border/30">
        {items.map((t, i) => (
          <div key={`${t}-${i}`} className="px-4 py-2.5 text-xs">
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
