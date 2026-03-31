"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { BOX_TYPE, STACK_TYPE, getDefinition } from "@aiui/registry";
import { cn } from "@/lib/utils";

function stackGapPx(props: Record<string, unknown>): number {
  const g = props.gap;
  if (typeof g === "number" && Number.isFinite(g)) return Math.max(0, g);
  if (typeof g === "string") {
    const n = Number(g);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return 0;
}

function stackDirection(props: Record<string, unknown>): "row" | "column" {
  return props.direction === "row" ? "row" : "column";
}

function PreviewNode(props: { node: UiNode }) {
  const { node } = props;
  const def = getDefinition(node.type);

  if (!def) {
    return (
      <div
        className="rounded border border-destructive/40 bg-destructive/5 px-2 py-1 font-mono text-xs text-destructive"
        data-aiui-unknown={node.type}
      >
        Unknown type: {node.type}
      </div>
    );
  }

  const children = node.children?.map((child) => (
    <PreviewNode key={child.id} node={child} />
  ));

  if (node.type === BOX_TYPE) {
    return (
      <div
        className={cn(
          "min-h-8 min-w-8 rounded-md border border-dashed border-muted-foreground/35 bg-background/60 p-2",
        )}
        data-aiui-type={BOX_TYPE}
      >
        {children}
      </div>
    );
  }

  if (node.type === STACK_TYPE) {
    const dir = stackDirection(node.props);
    const gap = stackGapPx(node.props);
    return (
      <div
        className={cn(
          "min-h-8 min-w-8 rounded-md border border-border/80 bg-card/40 p-2",
          dir === "row" ? "flex flex-row" : "flex flex-col",
        )}
        style={{ gap }}
        data-aiui-type={STACK_TYPE}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="text-xs text-muted-foreground" data-aiui-type={node.type}>
      {children}
    </div>
  );
}

export function DslPreview(props: { root: UiNode; className?: string }) {
  const { root, className } = props;
  return (
    <div
      className={cn(
        "min-h-[140px] rounded-xl border border-border bg-muted/25 p-4",
        className,
      )}
    >
      <PreviewNode node={root} />
    </div>
  );
}
