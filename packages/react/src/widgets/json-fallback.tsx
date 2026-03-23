"use client";

export function JsonFallbackWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <pre className="max-h-[480px] overflow-auto rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {text}
      </pre>
    </div>
  );
}
