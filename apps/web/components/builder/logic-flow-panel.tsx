"use client";

import type { Action } from "@aiui/dsl-schema";
import type { UiNode } from "@aiui/dsl-schema";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import {
  eventsToFlowElements,
  flowGraphStats,
  type LogicFlowNodeData,
} from "@/lib/logic/events-to-flow";
import { findNodeById } from "@/lib/document/tree";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type LogicFlowPanelProps = {
  root: UiNode;
  selectedId: string | null;
};

export function LogicFlowPanel(props: LogicFlowPanelProps) {
  const { root, selectedId } = props;

  const node = selectedId ? findNodeById(root, selectedId) : null;
  const events = node?.events;

  const eventsFingerprint = useMemo(
    () => JSON.stringify(events ?? {}),
    [events],
  );

  const { nodes, edges } = useMemo(
    () => eventsToFlowElements(events),
    [events],
  );

  const stats = useMemo(() => flowGraphStats(events), [events]);

  const flowKey = `${selectedId ?? "none"}-${eventsFingerprint}`;

  const [inspect, setInspect] = useState<{
    label: string;
    action: Action;
  } | null>(null);

  useEffect(() => {
    setInspect(null);
  }, [flowKey]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Logic graph
        </p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
          Synced with Properties
        </span>
      </div>
      <p className="mb-3 text-[0.65rem] leading-snug text-muted-foreground">
        Visual map of event bindings for the selected node.{" "}
        <code className="rounded bg-muted px-0.5">sequence</code> and{" "}
        <code className="rounded bg-muted px-0.5">condition</code> are expanded
        into steps. Click a step to inspect the underlying action JSON. Edit in
        Properties → Events.
      </p>
      {!selectedId ? (
        <p className="text-sm text-muted-foreground">
          Select a node to preview its logic flow.
        </p>
      ) : (
        <>
          <div className="nodrag nopan h-[min(320px,50vh)] w-full overflow-hidden rounded-lg border border-border bg-muted/20">
            <ReactFlowProvider key={flowKey}>
              <ReactFlow
                className="h-full w-full"
                defaultNodes={nodes}
                defaultEdges={edges}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                nodesFocusable
                panOnScroll
                zoomOnScroll
                minZoom={0.15}
                maxZoom={1.25}
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, n) => {
                  const data = n.data as LogicFlowNodeData | undefined;
                  if (data?.action) {
                    setInspect({
                      label: String(data.label ?? n.id),
                      action: data.action,
                    });
                  }
                }}
              >
                <Background gap={16} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                  className="bg-card!"
                  maskColor="rgb(0 0 0 / 0.12)"
                  zoomable
                  pannable
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
          <p className="mt-2 text-[0.6rem] text-muted-foreground">
            {stats.eventCount} event{stats.eventCount === 1 ? "" : "s"} ·{" "}
            {stats.stepCount} step{stats.stepCount === 1 ? "" : "s"} (after
            expansion)
          </p>
          {inspect ? (
            <div className="mt-2 rounded-lg border border-border bg-muted/25 p-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="text-xs font-medium leading-snug text-foreground">
                  {inspect.label}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  title="Close"
                  onClick={() => setInspect(null)}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </div>
              <pre className="max-h-36 overflow-auto rounded-md border border-border/60 bg-background/80 p-2 font-mono text-[0.65rem] leading-relaxed text-foreground">
                {JSON.stringify(inspect.action, null, 2)}
              </pre>
              <p className="mt-2 text-[0.6rem] leading-snug text-muted-foreground">
                This view is read-only. Update the same logic under
                Properties → Events — the graph refreshes automatically.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[0.6rem] text-muted-foreground">
              Tip: click a step node to inspect its action payload.
            </p>
          )}
        </>
      )}
    </div>
  );
}
