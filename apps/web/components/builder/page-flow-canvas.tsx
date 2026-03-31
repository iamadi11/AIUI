"use client";

import { useDroppable } from "@dnd-kit/core";
import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import type { Edge, Node, NodeMouseHandler, NodeProps } from "@xyflow/react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import {
  createContext,
  memo,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { RuntimePreviewHost } from "@/components/preview/runtime-preview-host";
import { formatNodeTitle } from "@/lib/builder/node-display";
import { previewDocumentForSubtree } from "@/lib/builder/preview-document-for-subtree";
import type { ViewportPreset } from "@/lib/builder/viewport-presets";
import { getViewportPreset } from "@/lib/builder/viewport-presets";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { CanvasDropData } from "./dnd-types";

/** Narrow column so each graph node stays readable without huge previews. */
const GRAPH_PREVIEW_VIEWPORT: ViewportPreset = {
  ...getViewportPreset("mobile"),
  width: 360,
  description: "Compact preview for page graph nodes.",
};

type PageNodeData = {
  uiNode: UiNode;
  depth: number;
};

type PageGraphPreviewBase = Pick<AiuiDocument, "version" | "layoutVersion"> & {
  state?: AiuiDocument["state"];
};

const PageGraphPreviewContext = createContext<PageGraphPreviewBase | null>(null);

type PageFlowCanvasProps = {
  root: UiNode;
  /** Used for preview document version/state (parity with main document). */
  document: AiuiDocument;
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
      position: { x: depth * 300, y: row * 120 },
      data: {
        uiNode: node,
        depth,
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

const PageGraphNode = memo(function PageGraphNode(
  props: NodeProps<Node<PageNodeData>>,
) {
  const previewBase = useContext(PageGraphPreviewContext);
  if (!previewBase) {
    throw new Error("PageGraphNode must render under PageGraphPreviewContext");
  }
  const { id, data, selected } = props;
  const uiNode = data.uiNode;
  const depth = data.depth;
  const childCount = (uiNode.children ?? []).length;
  const title =
    formatNodeTitle(uiNode).trim() || msg("builder.pageGraphNodeFallback");
  const roleLine =
    childCount === 0
      ? msg("builder.pageGraphLeaf")
      : msg("builder.pageGraphChildrenCount", { count: childCount });

  const previewDoc = useMemo(
    () => previewDocumentForSubtree(previewBase, uiNode),
    [previewBase, uiNode],
  );

  const { setNodeRef, isOver } = useDroppable({
    id: `page-graph-drop-${id}`,
    data: {
      parentId: id,
      depth,
    } satisfies CanvasDropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[260px] max-w-[380px] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        selected &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isOver && "ring-2 ring-primary/45 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="max-h-[220px] overflow-auto border-b border-border bg-muted/15">
        <RuntimePreviewHost
          document={previewDoc}
          viewport={GRAPH_PREVIEW_VIEWPORT}
          hideChrome
        />
      </div>
      <div className="px-3 py-2">
        <p className="truncate text-xs font-semibold">{title}</p>
        <p className="truncate font-mono text-[0.62rem] text-muted-foreground">
          {uiNode.id}
        </p>
        <p className="mt-1 text-[0.62rem] text-muted-foreground">{roleLine}</p>
      </div>
    </div>
  );
});

function PageGraphPaneDrop(props: {
  rootId: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "page-graph-pane",
    data: {
      parentId: props.rootId,
      depth: -1,
    } satisfies CanvasDropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative h-full min-h-0 w-full",
        isOver && "bg-primary/6",
      )}
    >
      {props.children}
    </div>
  );
}

const pageGraphNodeTypes = {
  pageNode: PageGraphNode,
};

export function PageFlowCanvas(props: PageFlowCanvasProps) {
  const { root, document: doc, selectedId, onSelect } = props;
  const previewBase = useMemo(
    () => ({
      version: doc.version,
      layoutVersion: doc.layoutVersion,
      state: doc.state,
    }),
    [doc.version, doc.layoutVersion, doc.state],
  );

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
      <PageGraphPreviewContext.Provider value={previewBase}>
        <ReactFlowProvider>
          <PageGraphPaneDrop rootId={root.id}>
            <ReactFlow
              className="h-full w-full"
              nodes={nodes}
              edges={graph.edges}
              nodeTypes={pageGraphNodeTypes}
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
          </PageGraphPaneDrop>
        </ReactFlowProvider>
      </PageGraphPreviewContext.Provider>
    </div>
  );
}
