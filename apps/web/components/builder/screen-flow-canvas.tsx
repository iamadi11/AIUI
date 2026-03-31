"use client";

import type {
  AiuiDocument,
  PrototypeEdge,
  PrototypeEdgeKind,
  UiNode,
} from "@aiui/dsl-schema";
import {
  applyEdgeChanges,
  Background,
  Controls,
  type Connection,
  type Edge,
  type EdgeChange,
  MarkerType,
  MiniMap,
  type Node,
  type NodeProps,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  Handle,
  Position,
} from "@xyflow/react";
import { useDroppable } from "@dnd-kit/core";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { useDocumentStore } from "@/stores/document-store";
import { cn } from "@/lib/utils";
import { msg } from "@/lib/i18n/messages";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function countUiLayers(root: UiNode): number {
  let total = 0;
  function walk(n: UiNode) {
    total += 1;
    for (const c of n.children ?? []) walk(c);
  }
  walk(root);
  return Math.max(0, total - 1);
}

export type ScreenFlowHandle = {
  screenToFlowPosition: (p: { x: number; y: number }) => {
    x: number;
    y: number;
  };
  /** Flow coordinates at the center of the visible graph pane (for template adds). */
  centerFlowPosition: () => { x: number; y: number };
};

function ScreenNode(props: NodeProps) {
  const { data, selected } = props;
  const d = data as {
    title: string;
    screenId: string;
    layerCount: number;
  };
  return (
    <Card
      className={cn(
        "min-w-[180px] max-w-[260px] gap-0 border-border py-0 shadow-sm transition-shadow",
        selected &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-border !bg-muted-foreground"
      />
      <CardHeader className="gap-1 px-3 py-2.5">
        <CardTitle className="text-xs font-semibold leading-tight">
          {d.title}
        </CardTitle>
        <CardDescription className="font-mono text-[0.65rem]">
          {d.screenId}
        </CardDescription>
        <p className="text-[0.65rem] text-muted-foreground">
          {msg("builder.screenNodeLayerCount", { count: d.layerCount })}
        </p>
      </CardHeader>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-border !bg-muted-foreground"
      />
    </Card>
  );
}

const nodeTypes = { screen: ScreenNode };

function prototypeToRfEdges(
  edges: PrototypeEdge[] | undefined,
  selectedEdgeId: string | null,
): Edge[] {
  if (!edges?.length) return [];
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.kind === "modal" ? "modal" : "nav",
    data: { kind: e.kind },
    markerEnd: { type: MarkerType.ArrowClosed },
    selected: e.id === selectedEdgeId,
  }));
}

function buildScreenNodes(
  doc: AiuiDocument,
  activeScreenId: string,
): Node[] {
  const positions = doc.flowLayout?.positions ?? {};
  let i = 0;
  return Object.entries(doc.screens).map(([screenId, def]) => {
    const pos =
      positions[screenId] ?? {
        x: (i % 4) * 280,
        y: Math.floor(i / 4) * 200,
      };
    i += 1;
    return {
      id: screenId,
      type: "screen",
      position: pos,
      data: {
        title: def.title ?? screenId,
        screenId,
        layerCount: countUiLayers(def.root),
      },
      selected: screenId === activeScreenId,
    };
  });
}

type InnerProps = {
  document: AiuiDocument;
  activeScreenId: string;
  nextEdgeKind: PrototypeEdgeKind;
  onSelectScreen: (id: string) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (id: string | null) => void;
};

const ScreenFlowInner = forwardRef<ScreenFlowHandle | null, InnerProps>(
  function ScreenFlowInner(props, ref) {
    const {
      document: doc,
      activeScreenId,
      nextEdgeKind,
      onSelectScreen,
      selectedEdgeId,
      onSelectEdge,
    } = props;
    const { screenToFlowPosition, getNodes } = useReactFlow();
    const setFlowPositions = useDocumentStore((s) => s.setFlowPositions);
    const setFlowEdges = useDocumentStore((s) => s.setFlowEdges);
    const connectScreens = useDocumentStore((s) => s.connectScreens);

    useImperativeHandle(
      ref,
      () => ({
        screenToFlowPosition: (p) => screenToFlowPosition(p),
        centerFlowPosition: () => {
          const pane = document.querySelector(
            ".react-flow .react-flow__pane",
          ) as HTMLElement | null;
          if (pane) {
            const r = pane.getBoundingClientRect();
            return screenToFlowPosition({
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
            });
          }
          const n = getNodes();
          let maxX = 0;
          let maxY = 0;
          for (const node of n) {
            maxX = Math.max(maxX, node.position.x);
            maxY = Math.max(maxY, node.position.y);
          }
          return { x: maxX + 280, y: maxY };
        },
      }),
      [getNodes, screenToFlowPosition],
    );

    const builtNodes = useMemo(
      () => buildScreenNodes(doc, activeScreenId),
      [doc, activeScreenId],
    );
    const builtEdges = useMemo(
      () => prototypeToRfEdges(doc.flowLayout?.edges, selectedEdgeId),
      [doc.flowLayout?.edges, selectedEdgeId],
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
    const [edges, setEdges] = useEdgesState(builtEdges);

    useEffect(() => {
      setNodes(buildScreenNodes(doc, activeScreenId));
    }, [doc, activeScreenId, setNodes]);

    useEffect(() => {
      setEdges(prototypeToRfEdges(doc.flowLayout?.edges, selectedEdgeId));
    }, [doc.flowLayout?.edges, selectedEdgeId, setEdges]);

    const onNodeDragStop = useCallback(() => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const n of getNodes()) {
        positions[n.id] = { x: n.position.x, y: n.position.y };
      }
      setFlowPositions(positions);
    }, [getNodes, setFlowPositions]);

    const onConnect = useCallback(
      (c: Connection) => {
        if (!c.source || !c.target) return;
        connectScreens(c.source, c.target, nextEdgeKind);
      },
      [connectScreens, nextEdgeKind],
    );

    const handleEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
        for (const c of changes) {
          if (c.type === "remove") {
            const current =
              useDocumentStore.getState().document.flowLayout?.edges ?? [];
            setFlowEdges(current.filter((e) => e.id !== c.id));
          }
        }
      },
      [setEdges, setFlowEdges],
    );

    return (
      <ReactFlow
        className="h-full w-full"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        onNodeClick={(_, n) => {
          onSelectEdge(null);
          onSelectScreen(n.id);
        }}
        onEdgeClick={(_, edge) => {
          onSelectEdge(edge.id);
        }}
        onPaneClick={() => {
          onSelectEdge(null);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesConnectable
        elementsSelectable
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
    );
  },
);

export type ScreenFlowCanvasProps = {
  document: AiuiDocument;
  activeScreenId: string;
  nextEdgeKind: PrototypeEdgeKind;
  onSelectScreen: (id: string) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (id: string | null) => void;
};

export const ScreenFlowCanvas = forwardRef<
  ScreenFlowHandle | null,
  ScreenFlowCanvasProps
>(function ScreenFlowCanvas(props, ref) {
  const { setNodeRef, isOver } = useDroppable({
    id: "flow-canvas-drop",
    data: { kind: "flow-canvas" as const },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "nodrag nopan flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/15",
        isOver && "ring-2 ring-primary/50",
      )}
    >
      <p className="shrink-0 border-b border-border px-2 py-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {msg("builder.screenFlowHeading")}
      </p>
      <div className="relative min-h-[220px] flex-1">
        <ReactFlowProvider>
          <ScreenFlowInner ref={ref} {...props} />
        </ReactFlowProvider>
      </div>
    </div>
  );
});
