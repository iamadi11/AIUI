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
import type { PrototypeEdgeKind, UiNode } from "@aiui/dsl-schema";
import { editorDocumentView } from "@aiui/dsl-schema";
import {
  BOX_TYPE,
  SCREEN_TEMPLATE_LABELS,
  type ScreenTemplateId,
  STACK_TYPE,
} from "@aiui/registry";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { formatNodeTitle } from "@/lib/builder/node-display";
import { analyzeDocumentPerformanceFromDoc } from "@/lib/builder/document-performance";
import { formatPerfSummaryLine } from "@/lib/builder/document-performance-ui";
import { getPathToNode } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuilderNavbar } from "./builder-navbar";
import { canvasPointerCollision } from "./builder-collision";
import { DataAndStateSheet } from "./data-and-state-sheet";
import { DocumentExportPanel } from "./document-export-panel";
import { LayoutDebugPanel } from "./layout-debug-panel";
import { LogicFlowPanel } from "./logic-flow-panel";
import { ComponentPalette } from "./component-palette";
import { DiagnosticsPanel } from "./diagnostics-panel";
import {
  type CanvasDropData,
  type PaletteDragData,
  isPaletteDragData,
} from "./dnd-types";
import { DRAG_COPY } from "./drag-copy";
import { NodeTree } from "./node-tree";
import { BuilderShortcutsHelp } from "./builder-shortcuts-help";
import { useBuilderShortcuts } from "./use-builder-shortcuts";
import {
  ScreenFlowCanvas,
  type ScreenFlowHandle,
} from "./screen-flow-canvas";
import { BuilderInspectorSheet } from "./builder-inspector-sheet";
import { msg } from "@/lib/i18n/messages";
import { PageFlowCanvas } from "./page-flow-canvas";

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

function BuilderDemoShell(props: { builderDevMode: boolean }) {
  const { builderDevMode } = props;
  const document = useDocumentStore((s) => s.document);
  const appendChildOfType = useDocumentStore((s) => s.appendChildOfType);
  const reset = useDocumentStore((s) => s.reset);
  const removeNode = useDocumentStore((s) => s.removeNode);
  const duplicateNode = useDocumentStore((s) => s.duplicateNode);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const activeScreenId = useDocumentStore((s) => s.activeScreenId);
  const setActiveScreenId = useDocumentStore((s) => s.setActiveScreenId);
  const addScreenFromPalette = useDocumentStore((s) => s.addScreenFromPalette);
  const addScreenFromTemplate = useDocumentStore((s) => s.addScreenFromTemplate);
  const removeScreen = useDocumentStore((s) => s.removeScreen);
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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [dataStateSheetOpen, setDataStateSheetOpen] = useState(false);
  const editorDoc = useMemo(
    () => editorDocumentView(document, activeScreenId),
    [document, activeScreenId],
  );
  const screenCount = Object.keys(document.screens).length;
  const hasMultipleScreens = screenCount > 1;
  const [screenMapOpen, setScreenMapOpen] = useState(false);
  useEffect(() => {
    if (!hasMultipleScreens) {
      setScreenMapOpen(false);
    }
  }, [hasMultipleScreens]);
  const showScreenGraph = hasMultipleScreens && screenMapOpen;
  const rootId = editorDoc.root.id;
  const userLayerCount = Math.max(0, countNodes(editorDoc.root) - 1);
  const performance = useMemo(
    () => analyzeDocumentPerformanceFromDoc(document),
    [document],
  );

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return null;
    return (
      document.flowLayout?.edges?.find((e) => e.id === selectedEdgeId) ?? null
    );
  }, [document, selectedEdgeId]);

  const selectNodeEx = useCallback(
    (id: string | null) => {
      setSelectedEdgeId(null);
      selectNode(id);
    },
    [selectNode],
  );

  const toggleNodeEx = useCallback(
    (id: string) => {
      setSelectedEdgeId(null);
      toggleNode(id);
    },
    [toggleNode],
  );

  const setSelectionEx = useCallback(
    (ids: string[]) => {
      setSelectedEdgeId(null);
      setSelection(ids);
    },
    [setSelection],
  );

  const clearSelectionEx = useCallback(() => {
    setSelectedEdgeId(null);
    clearSelection();
  }, [clearSelection]);

  const handleSelectScreen = useCallback(
    (id: string) => {
      setSelectedEdgeId(null);
      clearSelection();
      setActiveScreenId(id);
    },
    [clearSelection, setActiveScreenId],
  );

  const handleSelectEdge = useCallback(
    (id: string | null) => {
      setSelectedEdgeId(id);
      if (id !== null) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  const [activePalette, setActivePalette] = useState<PaletteDragData | null>(
    null,
  );
  const [nextEdgeKind, setNextEdgeKind] =
    useState<PrototypeEdgeKind>("navigate");
  const [screenTemplateChoice, setScreenTemplateChoice] = useState<
    "" | ScreenTemplateId
  >("");
  const flowRef = useRef<ScreenFlowHandle | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!activePalette) return;
    const fn = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", fn, { passive: true });
    return () => window.removeEventListener("pointermove", fn);
  }, [activePalette]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useBuilderShortcuts({
    documentRoot: editorDoc.root,
    selectedIds,
    selectedNodeId,
    rootId,
    undo,
    redo,
    duplicateNode,
    removeNode,
    setSelection: setSelectionEx,
    selectNode: selectNodeEx,
    clearSelection: clearSelectionEx,
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
      if (over?.id === "flow-canvas-drop") {
        const pos = flowRef.current?.screenToFlowPosition(
          pointerRef.current,
        );
        if (pos) {
          addScreenFromPalette(activeData.componentType, pos);
        }
        return;
      }
      const drop = over.data.current as CanvasDropData | undefined;
      if (!drop?.parentId) return;
      appendChildOfType(drop.parentId, activeData.componentType);
      return;
    }
  }

  function handleDragCancel() {
    setActivePalette(null);
  }

  const inspectorOpen =
    selectedNodeId !== null || selectedEdgeId !== null;

  function handleInspectorOpenChange(open: boolean) {
    if (!open) {
      clearSelectionEx();
    }
  }

  const canvasColumn = (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="min-h-0 flex-1">
        <PageFlowCanvas
          root={editorDoc.root}
          selectedId={selectedNodeId}
          onSelect={selectNodeEx}
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2">
        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          {msg("builder.workspacePrimaryHint")}
        </p>
      </div>

      {userLayerCount === 0 ? (
        <div className="shrink-0 rounded-xl border border-dashed border-primary/40 bg-primary/4 p-4">
          <p className="text-sm font-medium text-foreground">
            {msg("builder.emptyStateTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {msg(
              showScreenGraph
                ? "builder.emptyStateBodyMultiScreen"
                : "builder.emptyStateBody",
            )}
          </p>
        </div>
      ) : userLayerCount <= 2 && builderDevMode ? (
        <div className="shrink-0 rounded-xl border border-border/80 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            {msg("builder.nearEmptyState")}
          </p>
        </div>
      ) : null}

      {builderDevMode ? (
        <div className="flex min-h-0 max-h-[min(42vh,520px)] shrink-0 flex-col gap-3 overflow-y-auto">
          <BuilderShortcutsHelp />
          <section
            className="flex flex-col gap-2"
            aria-labelledby="builder-tree-heading"
          >
            <p
              id="builder-tree-heading"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {msg("builder.tree")}
            </p>
            <NodeTree
              node={editorDoc.root}
              depth={0}
              selectedIds={selectedIds}
              onSelect={selectNodeEx}
              onToggle={toggleNodeEx}
              onRangeSelect={(targetId) => {
                if (!selectedNodeId) {
                  selectNodeEx(targetId);
                  return;
                }
                const ids = collectNodeIds(editorDoc.root);
                const a = ids.indexOf(selectedNodeId);
                const b = ids.indexOf(targetId);
                if (a < 0 || b < 0) {
                  selectNodeEx(targetId);
                  return;
                }
                const from = Math.min(a, b);
                const to = Math.max(a, b);
                setSelectionEx(ids.slice(from, to + 1));
              }}
              rootId={rootId}
              labelledById="builder-tree-heading"
            />
          </section>

          <DocumentExportPanel document={document} />

          <LayoutDebugPanel
            root={editorDoc.root}
            documentLayoutVersion={document.layoutVersion}
          />

          <DiagnosticsPanel
            document={document}
            selectedCount={selectedIds.length}
            undoDepth={undoDepth}
            redoDepth={redoDepth}
            logicMapSlot={
              <LogicFlowPanel
                root={editorDoc.root}
                selectedId={selectedNodeId}
              />
            }
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
        </div>
      ) : null}

      {!builderDevMode && selectedIds.some((id) => id !== rootId) ? (
        <div className="flex shrink-0 flex-wrap gap-2">
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
        </div>
      ) : null}
    </div>
  );

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
      <div className="flex min-h-0 flex-1 flex-col">
        <BuilderNavbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => undo()}
          onRedo={() => redo()}
          onReset={() => reset()}
          onAddBoxToRoot={() => appendChildOfType(rootId, BOX_TYPE)}
          onAddStackToRoot={() => appendChildOfType(rootId, STACK_TYPE)}
          showAdvancedDevLink={!builderDevMode}
          onOpenDataAndState={() => setDataStateSheetOpen(true)}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(240px,280px)_1fr]">
          <aside
            aria-label={msg("builder.componentPaletteAriaLabel")}
            className="flex min-h-0 flex-col overflow-y-auto border-b border-border bg-muted/10 p-3 lg:border-b-0 lg:border-r"
          >
            <ComponentPalette />
          </aside>

          <main
            className="flex min-h-[min(42dvh,640px)] min-w-0 flex-col gap-3 overflow-hidden p-3 lg:min-h-0"
            aria-labelledby="builder-workspace-heading"
          >
            <h2 id="builder-workspace-heading" className="sr-only">
              {msg("builder.workspaceHeading")}
            </h2>

            {performance.isLargeDocument && builderDevMode ? (
              <div className="shrink-0 rounded-xl border border-amber-300/70 bg-amber-50/70 p-3">
                <p className="text-xs font-medium text-amber-900">
                  {msg("builder.largeDocumentGuardrailsActive")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
                  {formatPerfSummaryLine(performance)}{" "}
                  {msg("builder.largeDocumentDeferredBody")}
                </p>
              </div>
            ) : null}

            {builderDevMode ? (
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {msg("builder.selectionLabel")}{" "}
                  <span className="text-foreground">
                    {selectedIds.length === 0
                      ? msg("builder.selectionNone")
                      : selectedIds.length === 1
                        ? (() => {
                            const path = getPathToNode(
                              editorDoc.root,
                              selectedNodeId!,
                            );
                            return path?.map(formatNodeTitle).join(" › ") ?? "—";
                          })()
                        : msg("builder.selectionMany", {
                            count: selectedIds.length,
                          })}
                  </span>
                  {" · "}
                  {msg("builder.selectionHelp")}
                </p>
                {selectedIds.some((id) => id !== rootId) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
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
                  </div>
                ) : null}
              </div>
            ) : null}

            {!hasMultipleScreens ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <select
                  className="h-8 max-w-[min(100%,260px)] truncate rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground shadow-sm"
                  aria-label={msg("builder.addScreenTemplateAriaLabel")}
                  value={screenTemplateChoice}
                  onChange={(e) => {
                    const v = e.target.value as ScreenTemplateId | "";
                    if (!v) return;
                    const pos =
                      flowRef.current?.centerFlowPosition() ?? {
                        x: 200,
                        y: 160,
                      };
                    addScreenFromTemplate(v, pos);
                    setScreenTemplateChoice("");
                  }}
                >
                  <option value="">
                    {msg("builder.addScreenTemplatePlaceholder")}
                  </option>
                  {(
                    Object.keys(SCREEN_TEMPLATE_LABELS) as ScreenTemplateId[]
                  ).map((id) => (
                    <option key={id} value={id}>
                      {SCREEN_TEMPLATE_LABELS[id]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {msg("builder.singlePageAddScreenHint")}
                </p>
              </div>
            ) : null}
            {hasMultipleScreens ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/15 p-2">
                <p className="text-xs text-muted-foreground">
                  {msg("builder.screenMapEntryTitle")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant={showScreenGraph ? "outline" : "secondary"}
                  onClick={() => setScreenMapOpen((v) => !v)}
                >
                  {showScreenGraph
                    ? msg("builder.hideScreenMap")
                    : msg("builder.openScreenMap")}
                </Button>
              </div>
            ) : null}

            {showScreenGraph ? (
              <ResizablePanelGroup
                orientation="vertical"
                className="min-h-0 flex-1"
              >
                <ResizablePanel defaultSize={22} minSize={15}>
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={
                          nextEdgeKind === "navigate" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setNextEdgeKind("navigate")}
                      >
                        {msg("builder.edgeKindNavigate")}
                      </Button>
                      <Button
                        type="button"
                        variant={
                          nextEdgeKind === "modal" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setNextEdgeKind("modal")}
                      >
                        {msg("builder.edgeKindModal")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScreen(activeScreenId)}
                      >
                        {msg("builder.removeScreen")}
                      </Button>
                      <select
                        className="h-8 max-w-[min(100%,220px)] truncate rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground shadow-sm"
                        aria-label={msg("builder.addScreenTemplateAriaLabel")}
                        value={screenTemplateChoice}
                        onChange={(e) => {
                          const v = e.target.value as ScreenTemplateId | "";
                          if (!v) return;
                          const pos =
                            flowRef.current?.centerFlowPosition() ?? {
                              x: 200,
                              y: 160,
                            };
                          addScreenFromTemplate(v, pos);
                          setScreenTemplateChoice("");
                        }}
                      >
                        <option value="">
                          {msg("builder.addScreenTemplatePlaceholder")}
                        </option>
                        {(
                          Object.keys(
                            SCREEN_TEMPLATE_LABELS,
                          ) as ScreenTemplateId[]
                        ).map((id) => (
                          <option key={id} value={id}>
                            {SCREEN_TEMPLATE_LABELS[id]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ScreenFlowCanvas
                      ref={flowRef}
                      document={document}
                      activeScreenId={activeScreenId}
                      nextEdgeKind={nextEdgeKind}
                      onSelectScreen={handleSelectScreen}
                      selectedEdgeId={selectedEdgeId}
                      onSelectEdge={handleSelectEdge}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={78} minSize={25}>
                  {canvasColumn}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {canvasColumn}
              </div>
            )}
          </main>
        </div>
      </div>

      <DataAndStateSheet
        open={dataStateSheetOpen}
        onOpenChange={setDataStateSheetOpen}
      />

      <BuilderInspectorSheet
        open={inspectorOpen}
        onOpenChange={handleInspectorOpenChange}
        document={document}
        editorRoot={editorDoc.root}
        rootId={rootId}
        selectedNodeId={selectedEdgeId ? null : selectedNodeId}
        selectedEdge={selectedEdge}
      />

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

export function BuilderDemo() {
  const searchParams = useSearchParams();
  const builderDevMode = searchParams.get("dev") === "1";

  return <BuilderDemoShell builderDevMode={builderDevMode} />;
}
