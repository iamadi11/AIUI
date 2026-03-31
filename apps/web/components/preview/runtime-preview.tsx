"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import type { DiagnosticsSink } from "@aiui/runtime-core";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { ViewportPreset } from "@/lib/builder/viewport-presets";
import { RuntimeSurface } from "@/components/runtime/runtime-surface";

/**
 * Builder preview skin over `@aiui/runtime-react` / `@aiui/runtime-core`.
 */
export function RuntimePreview(props: {
  document: AiuiDocument;
  viewport: ViewportPreset;
  hideChrome?: boolean;
  diagnostics?: DiagnosticsSink;
}) {
  const hideChrome = props.hideChrome ?? false;

  return (
    <div className={cn(hideChrome ? "" : "space-y-2")}>
      {hideChrome ? null : (
        <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
          <span>
            {msg("runtime.simulatedViewport")}{" "}
            <span className="font-medium text-foreground">{props.viewport.label}</span>
          </span>
          <span className="font-mono">{props.viewport.width}px</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-auto",
          hideChrome
            ? "rounded-none border-none bg-transparent p-0"
            : "rounded-xl border border-border bg-muted/20 p-3",
        )}
      >
        <div
          className="mx-auto"
          style={{ width: `min(100%, ${props.viewport.width}px)` }}
        >
          <RuntimeSurface
            document={props.document}
            diagnostics={props.diagnostics}
            className={cn(
              "min-h-[140px] w-full p-4",
              hideChrome
                ? "rounded-none border-none bg-transparent"
                : "rounded-xl border border-border bg-muted/25",
            )}
          />
        </div>
      </div>
    </div>
  );
}
