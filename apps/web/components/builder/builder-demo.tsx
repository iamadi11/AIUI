"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { UiNode } from "@aiui/dsl-schema";
import { BOX_TYPE, STACK_TYPE } from "@aiui/registry";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNodeTitle } from "@/lib/builder/node-display";
import { BUILDER_DOCUMENT_TEMPLATES } from "@/lib/builder/document-templates";
import { getPathToNode } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";
import { useSelectionStore } from "@/stores/selection-store";
import { Redo2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BuilderCanvas } from "./builder-canvas";
import { BuilderShortcutsHelp } from "./builder-shortcuts-help";
import { canvasPointerCollision } from "./builder-collision";
import { DocumentExportPanel } from "./document-export-panel";
import { DocumentStatePanel } from "./document-state-panel";
import { LayoutDebugPanel } from "./layout-debug-panel";
import { LogicFlowPanel } from "./logic-flow-panel";
import { ComponentPalette } from "./component-palette";
import { PropertiesInspector } from "./properties-inspector";
import { DiagnosticsPanel } from "./diagnostics-panel";
import {
  type CanvasDropData,
  type PaletteDragData,
  isCanvasSiblingData,
  isPaletteDragData,
} from "./dnd-types";

function collectNodeIds(root: UiNode): string[] {
  const ids: string[] = [];
  function walk(node: UiNode) {
    ids.push(node.id);
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return ids;
}

export function BuilderDemo() {
  const document = useDocumentStore((s) => s.document);
  const appendChildOfType = useDocumentStore((s) => s.appendChildOfType);
  const reset = useDocumentStore((s) => s.reset);
  const removeNode = useDocumentStore((s) => s.removeNode);
  const duplicateNode = useDocumentStore((s) => s.duplicateNode);
  const insertChild = useDocumentStore((s) => s.insertChild);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const updateNode = useDocumentStore((s) => s.updateNode);
  const reorderSibling = useDocumentStore((s) => s.reorderSibling);
  const canUndo = useDocumentStore((s) => s.past.length > 0);
  const canRedo = useDocumentStore((s) => s.future.length > 0);
  const undoDepth = useDocumentStore((s) => s.past.length);
  const redoDepth = useDocumentStore((s) => s.future.length);

  const selectedNodeId = useSelectionStore((s) => s.selectedNodeId);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const toggleNode = useSelectionStore((s) => s.toggleNode);
  const setSelection = useSelectionStore((s) => s.setSelection);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  const rootId = document.root.id;

  const [activePalette, setActivePalette] = useState<PaletteDragData | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.("input, textarea, select, [contenteditable=true]")
      ) {
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        const targets = selectedIds.filter((id) => id !== rootId);
        if (targets.length === 0) return;
        for (const id of targets) {
          duplicateNode(id);
        }
        return;
      }
      if (meta && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setSelection(collectNodeIds(document.root));
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const targets = selectedIds.filter((id) => id !== rootId);
        if (targets.length === 0) return;
        e.preventDefault();
        for (const id of targets) {
          removeNode(id);
        }
        return;
      }
      if (e.key === "Escape") {
        clearSelection();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    undo,
    redo,
    clearSelection,
    setSelection,
    duplicateNode,
    removeNode,
    selectedIds,
    rootId,
    document.root,
  ]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (isPaletteDragData(data)) setActivePalette(data);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePalette(null);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;
    if (isPaletteDragData(activeData)) {
      const drop = over.data.current as CanvasDropData | undefined;
      if (!drop?.parentId) return;
      appendChildOfType(drop.parentId, activeData.componentType);
      return;
    }
    if (isCanvasSiblingData(activeData)) {
      const overData = over.data.current;
      if (!isCanvasSiblingData(overData)) return;
      if (activeData.parentId !== overData.parentId) return;
      if (active.id === over.id) return;
      reorderSibling(
        activeData.parentId,
        String(active.id),
        String(over.id),
      );
    }
  }

  function handleDragCancel() {
    setActivePalette(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const kind = args.active.data.current;
        if (isPaletteDragData(kind)) return canvasPointerCollision(args);
        return closestCenter(args);
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,200px)_1fr_minmax(0,260px)]">
          <ComponentPalette />
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!canUndo}
                onClick={() => undo()}
                title="Undo (⌘Z / Ctrl+Z)"
              >
                <Undo2 className="size-3.5" aria-hidden />
                Undo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!canRedo}
                onClick={() => redo()}
                title="Redo (⌘⇧Z / Ctrl+Y)"
              >
                <Redo2 className="size-3.5" aria-hidden />
                Redo
              </Button>
              <Link
                href="/preview"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Preview
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChildOfType(rootId, BOX_TYPE)}
              >
                Add Box to root
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChildOfType(rootId, STACK_TYPE)}
              >
                Add Stack to root
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => reset()}
              >
                Reset document
              </Button>
              {selectedIds.some((id) => id !== rootId) ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      for (const id of selectedIds) {
                        if (id !== rootId) duplicateNode(id);
                      }
                    }}
                    title="Duplicate layer (⌘D / Ctrl+D)"
                  >
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      for (const id of selectedIds) {
                        if (id !== rootId) removeNode(id);
                      }
                    }}
                  >
                    Remove selected
                  </Button>
                </>
              ) : null}
              {BUILDER_DOCUMENT_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  title={tpl.description}
                  onClick={() => {
                    const parentId = selectedNodeId ?? rootId;
                    insertChild(parentId, tpl.create());
                  }}
                >
                  {tpl.label}
                </Button>
              ))}
            </div>

            <BuilderShortcutsHelp />

            <p className="text-xs text-muted-foreground">
              Selection:{" "}
              <span className="text-foreground">
                {selectedIds.length === 0
                  ? "none"
                  : selectedIds.length === 1
                    ? (() => {
                        const path = getPathToNode(document.root, selectedNodeId!);
                        return path?.map(formatNodeTitle).join(" › ") ?? "—";
                      })()
                    : `${selectedIds.length} layers selected`}
              </span>
              {" · "}
              Click canvas or tree; double-click a label to rename. Esc clears
              selection. Root cannot be removed. Delete/Backspace removes the
              selection; ⌘/Ctrl+D duplicates. Undo/redo: ⌘Z / ⌘⇧Z (Ctrl+Z /
              Ctrl+Shift+Z or Ctrl+Y). See the Keyboard shortcuts panel below.
            </p>

            <BuilderCanvas
              document={document}
              selectedId={selectedNodeId}
              onSelect={selectNode}
              onToggleSelect={toggleNode}
              onLabelChange={(id, label) =>
                updateNode(id, (n) => ({
                  ...n,
                  props: { ...n.props, label },
                }))
              }
              onLeafLayoutResize={(id, width, height) =>
                updateNode(id, (n) => {
                  const prev = n.layout ? { ...n.layout } : {};
                  const next = { ...prev } as Record<string, unknown>;
                  next.width = width;
                  next.height = height;
                  return { ...n, layout: next };
                })
              }
            />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tree
              </p>
              <NodeTree
                node={document.root}
                depth={0}
                selectedIds={selectedIds}
                onSelect={selectNode}
                onToggle={toggleNode}
                rootId={rootId}
              />
            </div>

            <DocumentExportPanel document={document} />

            <DocumentStatePanel />

            <LayoutDebugPanel
              root={document.root}
              documentLayoutVersion={document.layoutVersion}
            />

            <LogicFlowPanel root={document.root} selectedId={selectedNodeId} />

            <DiagnosticsPanel
              document={document}
              selectedCount={selectedIds.length}
              undoDepth={undoDepth}
              redoDepth={redoDepth}
            />

            <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Live document (Zustand)
              </p>
              <pre className="max-h-64 overflow-auto text-sm leading-relaxed">
                {JSON.stringify(document, null, 2)}
              </pre>
            </div>
          </div>

          <PropertiesInspector
            root={document.root}
            selectedId={selectedNodeId}
            rootId={rootId}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activePalette ? (
          <div className="rounded-lg border border-primary bg-card px-3 py-2 font-mono text-sm shadow-lg">
            {activePalette.componentType}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function NodeTree(props: {
  node: UiNode;
  depth: number;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  rootId: string;
}) {
  const { node, depth, selectedIds, onSelect, onToggle, rootId } = props;
  const pad = depth * 12;
  const isRoot = node.id === rootId;
  const title = formatNodeTitle(node);

  return (
    <div className="text-sm">
      <button
        type="button"
        title={node.id}
        className={cn(
          "flex w-full rounded-md border border-transparent px-2 py-1.5 text-left transition-colors",
          "hover:border-border hover:bg-muted/50",
          selectedIds.includes(node.id) &&
            "border-primary/40 bg-muted/80 shadow-sm",
        )}
        style={{ paddingLeft: pad + 8 }}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            onToggle(node.id);
          } else {
            onSelect(node.id);
          }
        }}
      >
        <span className="shrink-0 font-medium text-foreground">{title}</span>
        {isRoot ? (
          <span className="ml-2 shrink-0 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Root
          </span>
        ) : null}
      </button>
      {node.children?.map((child) => (
        <NodeTree
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onToggle={onToggle}
          rootId={rootId}
        />
      ))}
    </div>
  );
}
