"use client";

import type { UiNode } from "@aiui/dsl-schema";
import type { Edge, Node, NodeMouseHandler, NodeProps } from "@xyflow/react";
import { Background, Controls, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useMemo } from "react";
import { formatNodeTitle } from "@/lib/builder/node-display";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

type PageNodeData = {
  title: string;
  subtitle: string;
  childCount: number;
};

type PageFlowCanvasProps = {
  root: UiNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

function buildTreeFlow(root: UiNode): { nodes: Node<PageNodeData>[]; edges: Edge[] } {
  const nodes: Node<PageNodeData>[] = [];
  const edges: Edge[] = [];
  const depthRows = new Map<number, number>();

  function walk(node: UiNode, depth: number, parentId?: string) {
    const row = depthRows.get(depth) ?? 0;
    depthRows.set(depth, row + 1);
    nodes.push({
      id: node.id,
      position: { x: depth * 280, y: row * 96 },
      data: {
        title: formatNodeTitle(node),
        subtitle: node.id,
        childCount: (node.children ?? []).length,
      },
      draggable: false,
      selectable: true,
    });
    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        animated: false,
      });
    }
    for (const child of node.children ?? []) walk(child, depth + 1, node.id);
  }

  walk(root, 0);
  return { nodes, edges };
}

function NodeCard(props: NodeProps<Node<PageNodeData>>) {
  const { data, selected } = props;
  const childCount = data.childCount ?? 0;
  const roleLine =
    childCount === 0
      ? msg("builder.pageGraphLeaf")
      : msg("builder.pageGraphChildrenCount", { count: childCount });

  return (
    <div
      className={cn(
        "min-w-[220px] max-w-[280px] rounded-lg border border-border bg-card px-3 py-2 text-card-foreground shadow-sm",
        selected &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <p className="truncate text-xs font-semibold">
        {data.title?.trim() ? data.title : msg("builder.pageGraphNodeFallback")}
      </p>
      <p className="truncate font-mono text-[0.62rem] text-muted-foreground">
        {data.subtitle}
      </p>
      <p className="mt-1 text-[0.62rem] text-muted-foreground">{roleLine}</p>
    </div>
  );
}

const nodeTypes = {
  pageNode: NodeCard,
};

export function PageFlowCanvas(props: PageFlowCanvasProps) {
  const { root, selectedId, onSelect } = props;
  const graph = useMemo(() => buildTreeFlow(root), [root]);
  const nodes = useMemo(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        type: "pageNode",
        selected: node.id === selectedId,
      })),
    [graph.nodes, selectedId],
  );

  const onNodeClick: NodeMouseHandler = (_, node) => {
    onSelect(node.id);
  };

  return (
    <div className="h-full min-h-0 rounded-xl border border-border bg-muted/10">
      <ReactFlowProvider>
        <ReactFlow
          className="h-full w-full"
          nodes={nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesConnectable={false}
          nodesDraggable={false}
          onNodeClick={onNodeClick}
          onPaneClick={() => onSelect(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
