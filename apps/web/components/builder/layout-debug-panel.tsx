"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { LAYOUT_VERSION } from "@aiui/dsl-schema";
import { layoutDocument } from "@aiui/layout-engine";
import { useMemo, useState } from "react";

const PREVIEW_WIDTH = 400;

export function LayoutDebugPanel(props: {
  root: UiNode;
  documentLayoutVersion?: string;
}) {
  const { root, documentLayoutVersion } = props;
  const [width, setWidth] = useState(PREVIEW_WIDTH);
  const rects = useMemo(
    () => layoutDocument(root, { width }),
    [root, width],
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
        at width constraint{" "}
        <span className="font-mono">{width}</span>
        px.
        Document <code className="font-mono">layoutVersion</code>:{" "}
        <span className="font-mono">{documentLayoutVersion ?? "—"}</span> · engine:{" "}
        <span className="font-mono">{LAYOUT_VERSION}</span>
      </p>
      <div className="mb-3 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
        <span className="shrink-0">Width constraint</span>
        <input
          type="range"
          min={240}
          max={960}
          step={8}
          value={width}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(next)) setWidth(next);
          }}
          className="h-1 w-full cursor-pointer accent-primary"
          aria-label="Layout width constraint"
        />
        <input
          type="number"
          min={1}
          max={1200}
          step={8}
          value={width}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value, 10);
            if (!Number.isFinite(next)) return;
            setWidth(Math.min(1200, Math.max(1, next)));
          }}
          className="w-16 rounded border border-input bg-background px-1 py-0.5 text-right text-[0.7rem] text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          className="shrink-0 rounded border border-input bg-background px-1.5 py-0.5 text-[0.65rem] font-medium text-foreground shadow-sm hover:bg-muted"
          onClick={() => setWidth(PREVIEW_WIDTH)}
        >
          Reset
        </button>
      </div>
      <pre className="max-h-56 overflow-auto text-xs leading-relaxed">
        {JSON.stringify(serialized, null, 2)}
      </pre>
    </div>
  );
}
