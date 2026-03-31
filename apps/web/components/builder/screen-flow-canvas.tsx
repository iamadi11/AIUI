"use client";

import type {
  AiuiDocument,
  PrototypeEdge,
  PrototypeEdgeKind,
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

export type ScreenFlowHandle = {
  screenToFlowPosition: (p: { x: number; y: number }) => {
    x: number;
    y: number;
  };
};

function ScreenNode(props: NodeProps) {
  const { data, selected } = props;
  const d = data as { title: string; screenId: string };
  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border border-border bg-card px-3 py-2 shadow-sm",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-border !bg-muted-foreground"
      />
      <p className="truncate text-xs font-medium text-foreground">{d.title}</p>
      <p className="truncate font-mono text-[0.65rem] text-muted-foreground">
        {d.screenId}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-border !bg-muted-foreground"
      />
    </div>
  );
}

const nodeTypes = { screen: ScreenNode };

function prototypeToRfEdges(edges: PrototypeEdge[] | undefined): Edge[] {
  if (!edges?.length) return [];
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.kind === "modal" ? "modal" : "nav",
    data: { kind: e.kind },
    markerEnd: { type: MarkerType.ArrowClosed },
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
};

const ScreenFlowInner = forwardRef<ScreenFlowHandle | null, InnerProps>(
  function ScreenFlowInner(props, ref) {
    const { document: doc, activeScreenId, nextEdgeKind, onSelectScreen } =
      props;
    const { screenToFlowPosition, getNodes } = useReactFlow();
    const setFlowPositions = useDocumentStore((s) => s.setFlowPositions);
    const setFlowEdges = useDocumentStore((s) => s.setFlowEdges);
    const connectScreens = useDocumentStore((s) => s.connectScreens);

    useImperativeHandle(ref, () => ({
      screenToFlowPosition: (p) => screenToFlowPosition(p),
    }));

    const builtNodes = useMemo(
      () => buildScreenNodes(doc, activeScreenId),
      [doc, activeScreenId],
    );
    const builtEdges = useMemo(
      () => prototypeToRfEdges(doc.flowLayout?.edges),
      [doc.flowLayout?.edges],
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(builtEdges);

    useEffect(() => {
      setNodes(buildScreenNodes(doc, activeScreenId));
    }, [doc, activeScreenId, setNodes]);

    useEffect(() => {
      setEdges(prototypeToRfEdges(doc.flowLayout?.edges));
    }, [doc.flowLayout?.edges, setEdges]);

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
          onSelectScreen(n.id);
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
        "nodrag nopan flex min-h-[220px] w-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/15",
        isOver && "ring-2 ring-primary/50",
      )}
    >
      <p className="border-b border-border px-2 py-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {msg("builder.screenFlowHeading")}
      </p>
      <div className="relative min-h-[min(320px,40vh)] flex-1">
        <ReactFlowProvider>
          <ScreenFlowInner ref={ref} {...props} />
        </ReactFlowProvider>
      </div>
    </div>
  );
});
