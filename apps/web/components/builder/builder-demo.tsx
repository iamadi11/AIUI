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
import type { RuntimeDiagnostic } from "@aiui/runtime-core";
import { BOX_TYPE, STACK_TYPE } from "@aiui/registry";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { msg } from "@/lib/i18n/messages";
import { formatNodeTitle } from "@/lib/builder/node-display";
import { analyzeDocumentPerformance } from "@/lib/builder/document-performance";
import { BUILDER_DOCUMENT_TEMPLATES } from "@/lib/builder/document-templates";
import { getPathToNode } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";
import { useSelectionStore } from "@/stores/selection-store";
import { createRuntimeIssueTelemetryEnvelope } from "@/lib/diagnostics/issue-telemetry";
import { useIssueTelemetryStore } from "@/stores/issue-telemetry-store";
import { Redo2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BuilderCanvas } from "./builder-canvas";
import { BuilderShortcutsHelp } from "./builder-shortcuts-help";
import { canvasPointerCollision } from "./builder-collision";
import { DocumentExportPanel } from "./document-export-panel";
import { DocumentStatePanel } from "./document-state-panel";
import { LayoutDebugPanel } from "./layout-debug-panel";
import { LogicFlowPanel } from "./logic-flow-panel";
import { FirstTimeWalkthroughPanel } from "./first-time-walkthrough-panel";
import { ComponentPalette } from "./component-palette";
import { PropertiesInspector } from "./properties-inspector";
import { DiagnosticsPanel } from "./diagnostics-panel";
import {
  type CanvasDropData,
  type PaletteDragData,
  isCanvasSiblingData,
  isPaletteDragData,
} from "./dnd-types";
import { DRAG_COPY } from "./drag-copy";
import { NodeTree } from "./node-tree";
import { useBuilderShortcuts } from "./use-builder-shortcuts";

function collectNodeIds(root: UiNode): string[] {
  const ids: string[] = [];
  function walk(node: UiNode) {
    ids.push(node.id);
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return ids;
}

function countNodes(root: UiNode): number {
  let total = 0;
  function walk(node: UiNode) {
    total += 1;
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return total;
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
  const recordIssue = useIssueTelemetryStore((s) => s.recordIssue);

  const rootId = document.root.id;
  const starterDashboardTemplate = BUILDER_DOCUMENT_TEMPLATES.find(
    (tpl) => tpl.id === "starter-dashboard",
  );
  const userLayerCount = Math.max(0, countNodes(document.root) - 1);
  const performance = useMemo(
    () => analyzeDocumentPerformance(document.root),
    [document.root],
  );

  const [activePalette, setActivePalette] = useState<PaletteDragData | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useBuilderShortcuts({
    documentRoot: document.root,
    selectedIds,
    selectedNodeId,
    rootId,
    undo,
    redo,
    duplicateNode,
    removeNode,
    setSelection,
    selectNode,
    clearSelection,
  });

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

  function handleRuntimeDiagnostic(diagnostic: RuntimeDiagnostic) {
    recordIssue(
      createRuntimeIssueTelemetryEnvelope({
        diagnostic,
        documentVersion: document.version,
      }),
    );
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
          <aside aria-label={msg("builder.componentPaletteAriaLabel")}>
            <ComponentPalette />
          </aside>
          <main className="min-w-0 space-y-4" aria-labelledby="builder-workspace-heading">
            <h2 id="builder-workspace-heading" className="sr-only">
              {msg("builder.workspaceHeading")}
            </h2>
            <div
              className="flex flex-wrap gap-2"
              role="toolbar"
              aria-label={msg("builder.actionsAriaLabel")}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!canUndo}
                onClick={() => undo()}
                title={msg("builder.undoTitle")}
              >
                <Undo2 className="size-3.5" aria-hidden />
                {msg("builder.undo")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!canRedo}
                onClick={() => redo()}
                title={msg("builder.redoTitle")}
              >
                <Redo2 className="size-3.5" aria-hidden />
                {msg("builder.redo")}
              </Button>
              <Link
                href="/preview"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {msg("builder.preview")}
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChildOfType(rootId, BOX_TYPE)}
              >
                {msg("builder.addBoxToRoot")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChildOfType(rootId, STACK_TYPE)}
              >
                {msg("builder.addStackToRoot")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => reset()}
              >
                {msg("builder.resetDocument")}
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
                    title={msg("builder.duplicateTitle")}
                  >
                    {msg("builder.duplicate")}
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
                    {msg("builder.removeSelected")}
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

            {performance.isLargeDocument ? (
              <div className="rounded-xl border border-amber-300/70 bg-amber-50/70 p-3">
                <p className="text-xs font-medium text-amber-900">
                  {msg("builder.largeDocumentGuardrailsActive")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
                  {performance.summary} Some heavy diagnostics are deferred by
                  default to keep editing responsive.
                </p>
              </div>
            ) : null}

            <FirstTimeWalkthroughPanel
              document={document}
              selectedCount={selectedIds.length}
              onAddBox={() => appendChildOfType(rootId, BOX_TYPE)}
              onAddStack={() => appendChildOfType(rootId, STACK_TYPE)}
              onInsertStarterTemplate={() => {
                if (!starterDashboardTemplate) return;
                const parentId = selectedNodeId ?? rootId;
                insertChild(parentId, starterDashboardTemplate.create());
              }}
            />

            <p className="text-xs text-muted-foreground" aria-live="polite">
              {msg("builder.selectionLabel")}{" "}
              <span className="text-foreground">
                {selectedIds.length === 0
                  ? msg("builder.selectionNone")
                  : selectedIds.length === 1
                    ? (() => {
                        const path = getPathToNode(document.root, selectedNodeId!);
                        return path?.map(formatNodeTitle).join(" › ") ?? "—";
                      })()
                    : msg("builder.selectionMany", { count: selectedIds.length })}
              </span>
              {" · "}
              {msg("builder.selectionHelp")}
            </p>

            <BuilderCanvas
              document={document}
              onRuntimeDiagnostic={handleRuntimeDiagnostic}
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

            {userLayerCount === 0 ? (
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/4 p-4">
                <p className="text-sm font-medium text-foreground">
                  {msg("builder.emptyStateTitle")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {msg("builder.emptyStateBody")}
                </p>
              </div>
            ) : userLayerCount <= 2 ? (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  {msg("builder.nearEmptyState")}
                </p>
              </div>
            ) : null}

            <section className="space-y-2" aria-labelledby="builder-tree-heading">
              <p
                id="builder-tree-heading"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {msg("builder.tree")}
              </p>
              <NodeTree
                node={document.root}
                depth={0}
                selectedIds={selectedIds}
                onSelect={selectNode}
                onToggle={toggleNode}
                onRangeSelect={(targetId) => {
                  if (!selectedNodeId) {
                    selectNode(targetId);
                    return;
                  }
                  const ids = collectNodeIds(document.root);
                  const a = ids.indexOf(selectedNodeId);
                  const b = ids.indexOf(targetId);
                  if (a < 0 || b < 0) {
                    selectNode(targetId);
                    return;
                  }
                  const from = Math.min(a, b);
                  const to = Math.max(a, b);
                  setSelection(ids.slice(from, to + 1));
                }}
                rootId={rootId}
                labelledById="builder-tree-heading"
              />
            </section>

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

            <section
              className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
              aria-labelledby="live-document-heading"
            >
              <p
                id="live-document-heading"
                className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {msg("builder.liveDocument")}
              </p>
              {performance.scaleLevel === "very_large" ? (
                <p className="text-xs text-muted-foreground">
                  {msg("builder.liveDocumentHidden")}
                </p>
              ) : (
                <pre className="max-h-64 overflow-auto text-sm leading-relaxed">
                  {JSON.stringify(document, null, 2)}
                </pre>
              )}
            </section>
          </main>

          <aside aria-label={msg("builder.propertiesInspectorAriaLabel")}>
            <PropertiesInspector
              root={document.root}
              selectedId={selectedNodeId}
              rootId={rootId}
            />
          </aside>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activePalette ? (
          <div className="rounded-lg border border-primary bg-card px-3 py-2 font-mono text-sm shadow-lg">
            {DRAG_COPY.overlayPrefix} {activePalette.componentType}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
