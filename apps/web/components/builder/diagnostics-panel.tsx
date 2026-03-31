"use client";

import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { safeParseDocument } from "@aiui/dsl-schema";

function countTree(root: UiNode): {
  nodeCount: number;
  leafCount: number;
  eventCount: number;
  actionCount: number;
} {
  let nodeCount = 0;
  let leafCount = 0;
  let eventCount = 0;
  let actionCount = 0;

  function walk(node: UiNode) {
    nodeCount += 1;
    const kids = node.children ?? [];
    if (kids.length === 0) {
      leafCount += 1;
    }
    const events = node.events ?? {};
    for (const actions of Object.values(events)) {
      eventCount += 1;
      actionCount += actions.length;
    }
    for (const child of kids) walk(child);
  }

  walk(root);
  return { nodeCount, leafCount, eventCount, actionCount };
}

export function DiagnosticsPanel(props: {
  document: AiuiDocument;
  selectedCount: number;
  undoDepth: number;
  redoDepth: number;
}) {
  const { document, selectedCount, undoDepth, redoDepth } = props;
  const parse = safeParseDocument(document);
  const tree = countTree(document.root);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Diagnostics
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Schema</span>
          <p className="font-medium text-foreground">
            {parse.success ? "valid" : "invalid"}
          </p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Selected</span>
          <p className="font-medium text-foreground">{selectedCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Nodes</span>
          <p className="font-medium text-foreground">{tree.nodeCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Leaves</span>
          <p className="font-medium text-foreground">{tree.leafCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Events</span>
          <p className="font-medium text-foreground">{tree.eventCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Actions</span>
          <p className="font-medium text-foreground">{tree.actionCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Undo depth</span>
          <p className="font-medium text-foreground">{undoDepth}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Redo depth</span>
          <p className="font-medium text-foreground">{redoDepth}</p>
        </div>
      </div>
      {!parse.success ? (
        <p className="mt-2 text-[0.65rem] text-destructive">
          {parse.error.issues[0]?.message ?? "Document validation failed."}
        </p>
      ) : null}
    </div>
  );
}
