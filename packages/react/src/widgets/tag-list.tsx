"use client";

export function TagListWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  if (!Array.isArray(data) || !data.every((x) => typeof x === "string")) {
    return null;
  }
  const tags = data as string[];
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center rounded-full bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
