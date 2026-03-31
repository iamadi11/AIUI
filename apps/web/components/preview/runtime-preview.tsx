"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { AiuiRuntime } from "@aiui/runtime-react";
import { cn } from "@/lib/utils";

/**
 * Builder preview skin over `@aiui/runtime-react` / `@aiui/runtime-core`.
 */
export function RuntimePreview(props: { document: AiuiDocument }) {
  return (
    <AiuiRuntime
      document={props.document}
      className={cn(
        "min-h-[140px] w-full rounded-xl border border-border bg-muted/25 p-4",
      )}
    />
  );
}
