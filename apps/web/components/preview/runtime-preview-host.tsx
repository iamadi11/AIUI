"use client";

import { forwardRef } from "react";
import type { AiuiDocument } from "@aiui/dsl-schema";
import type { DiagnosticsSink } from "@aiui/runtime-core";
import { RuntimeSurface } from "@/components/runtime/runtime-surface";
import { cn } from "@/lib/utils";
import type { ViewportPreset } from "@/lib/builder/viewport-presets";

export type RuntimePreviewHostProps = {
  document: AiuiDocument;
  viewport: ViewportPreset;
  hideChrome?: boolean;
  diagnostics?: DiagnosticsSink;
};

/**
 * Shared viewport frame for `RuntimeSurface`: same DOM/CSS as `/preview`
 * (default chrome) and the builder canvas (typically `hideChrome`).
 *
 * `ref` attaches to the centered column (`min(100%, viewport width)`) for
 * builder layout measurement.
 */
export const RuntimePreviewHost = forwardRef<
  HTMLDivElement,
  RuntimePreviewHostProps
>(function RuntimePreviewHost(props, ref) {
  const hideChrome = props.hideChrome ?? false;

  return (
    <div
      className={cn(
        "w-full overflow-auto",
        hideChrome
          ? "rounded-none border-none bg-transparent p-0"
          : "rounded-xl border border-border bg-muted/20 p-3",
      )}
    >
      <div
        ref={ref}
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
  );
});
