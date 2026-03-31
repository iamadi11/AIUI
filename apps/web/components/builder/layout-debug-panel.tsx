"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { LAYOUT_VERSION } from "@aiui/dsl-schema";
import { layoutDocument } from "@aiui/layout-engine";
import { useMemo } from "react";

const PREVIEW_WIDTH = 400;

export function LayoutDebugPanel(props: {
  root: UiNode;
  documentLayoutVersion?: string;
}) {
  const { root, documentLayoutVersion } = props;
  const rects = useMemo(
    () => layoutDocument(root, { width: PREVIEW_WIDTH }),
    [root],
  );
  const serialized = useMemo(() => {
    const o: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {};
    for (const [id, r] of rects) {
      o[id] = r;
    }
    return o;
  }, [rects]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Layout engine (debug)
      </p>
      <p className="mb-2 text-xs text-muted-foreground leading-relaxed">
        <code className="font-mono text-[0.65rem]">@aiui/layout-engine</code>{" "}
        at fixed width <span className="font-mono">{PREVIEW_WIDTH}</span>px.
        Document <code className="font-mono">layoutVersion</code>:{" "}
        <span className="font-mono">{documentLayoutVersion ?? "—"}</span> · engine:{" "}
        <span className="font-mono">{LAYOUT_VERSION}</span>
      </p>
      <pre className="max-h-56 overflow-auto text-xs leading-relaxed">
        {JSON.stringify(serialized, null, 2)}
      </pre>
    </div>
  );
}
