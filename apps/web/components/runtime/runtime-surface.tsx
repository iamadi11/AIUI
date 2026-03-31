"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { AiuiRuntime } from "@aiui/runtime-react";
import { cn } from "@/lib/utils";

type RuntimeSurfaceProps = {
  document: AiuiDocument;
  className?: string;
};

/**
 * Single in-app render surface used by builder canvas and preview.
 * Keeps both experiences on the exact same runtime mount path.
 */
export function RuntimeSurface(props: RuntimeSurfaceProps) {
  return <AiuiRuntime document={props.document} className={cn(props.className)} />;
}
