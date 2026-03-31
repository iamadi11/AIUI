"use client";

import type { UiNode } from "@aiui/dsl-schema";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { useMemo } from "react";
import { eventsToFlowElements } from "@/lib/logic/events-to-flow";
import { findNodeById } from "@/lib/document/tree";

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

  const flowKey = `${selectedId ?? "none"}-${eventsFingerprint}`;

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Logic graph
      </p>
      <p className="mb-3 text-[0.65rem] leading-snug text-muted-foreground">
        Read-only view of the selected node&apos;s event bindings (React Flow).
        Edit actions in the Properties panel.
      </p>
      {!selectedId ? (
        <p className="text-sm text-muted-foreground">
          Select a node to preview its logic flow.
        </p>
      ) : (
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
              elementsSelectable={false}
              panOnScroll
              zoomOnScroll
              minZoom={0.15}
              maxZoom={1.25}
              proOptions={{ hideAttribution: true }}
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
      )}
    </div>
  );
}
