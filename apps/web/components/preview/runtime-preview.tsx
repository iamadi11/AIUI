"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import type { DiagnosticsSink } from "@aiui/runtime-core";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { ViewportPreset } from "@/lib/builder/viewport-presets";
import { RuntimePreviewHost } from "@/components/preview/runtime-preview-host";

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
            <span className="font-medium text-foreground">
              {props.viewport.label}
            </span>
          </span>
          <span className="font-mono">{props.viewport.width}px</span>
        </div>
      )}
      <RuntimePreviewHost
        document={props.document}
        viewport={props.viewport}
        hideChrome={hideChrome}
        diagnostics={props.diagnostics}
      />
    </div>
  );
}
