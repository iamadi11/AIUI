"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { cn } from "@/lib/utils";
import type { ViewportPreset } from "@/lib/builder/viewport-presets";
import { RuntimeSurface } from "@/components/runtime/runtime-surface";

/**
 * Builder preview skin over `@aiui/runtime-react` / `@aiui/runtime-core`.
 */
export function RuntimePreview(props: {
  document: AiuiDocument;
  viewport: ViewportPreset;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
        <span>
          Simulated viewport:{" "}
          <span className="font-medium text-foreground">{props.viewport.label}</span>
        </span>
        <span className="font-mono">{props.viewport.width}px</span>
      </div>
      <div className="w-full overflow-auto rounded-xl border border-border bg-muted/20 p-3">
        <div
          className="mx-auto"
          style={{ width: `min(100%, ${props.viewport.width}px)` }}
        >
          <RuntimeSurface
            document={props.document}
            className={cn(
              "min-h-[140px] w-full rounded-xl border border-border bg-muted/25 p-4",
            )}
          />
        </div>
      </div>
    </div>
  );
}
