import type {
  AiuiDocument,
  FlowLayout,
  PrototypeEdge,
  PrototypeEdgeKind,
  UiNode,
} from "@aiui/dsl-schema";
import { create } from "zustand";
import {
  cloneDocument,
  cloneUiSubtreeWithNewIds,
  createInitialDocument,
  createNodeFromType,
  DEFAULT_SCREEN_ID,
} from "@/lib/document/model";
import { applyPrototypeEdgeToDocument } from "@/lib/builder/prototype-edge";
import { newNodeId } from "@/lib/id";
import {
  findNodeById,
  findParentOf,
  insertChild as insertChildInTree,
  removeNodeById,
  reorderSibling as reorderSiblingInTree,
  updateNodeById,
} from "@/lib/document/tree";
import { useSelectionStore } from "@/stores/selection-store";
import {
  SCREEN_TEMPLATE_LABELS,
  type ScreenTemplateId,
  STACK_TYPE,
} from "@aiui/registry";
import { buildScreenTemplateRoot } from "@/lib/builder/screen-template-builders";

const MAX_HISTORY = 50;

function truncatePast(past: AiuiDocument[]): AiuiDocument[] {
  if (past.length <= MAX_HISTORY) return past;
  return past.slice(past.length - MAX_HISTORY);
}

function truncateFuture(future: AiuiDocument[]): AiuiDocument[] {
  if (future.length <= MAX_HISTORY) return future;
  return future.slice(0, MAX_HISTORY);
}

function replaceActiveScreenRoot(
  document: AiuiDocument,
  activeScreenId: string,
  nextRoot: UiNode,
): AiuiDocument {
  const screen = document.screens[activeScreenId];
  if (!screen) return document;
  return {
    ...document,
    screens: {
      ...document.screens,
      [activeScreenId]: { ...screen, root: nextRoot },
    },
  };
}

function sanitizeSelection(document: AiuiDocument, activeScreenId: string) {
  const root = document.screens[activeScreenId]?.root;
  useSelectionStore.getState().reconcileSelection((id) => {
    if (!root) return false;
    return !!findNodeById(root, id);
  });
}

type DocumentState = {
  document: AiuiDocument;
  /** Which screen subtree the canvas / tree editor targets. */
  activeScreenId: string;
  past: AiuiDocument[];
  future: AiuiDocument[];
  setDocument: (document: AiuiDocument) => void;
  setActiveScreenId: (screenId: string) => void;
  setRoot: (root: UiNode) => void;
  /** Replace document `state` (initial logic state). Pass `undefined` or `{}` to clear. */
  setDocumentState: (state: Record<string, unknown> | undefined) => void;
  updateNode: (id: string, updater: (node: UiNode) => UiNode) => void;
  insertChild: (parentId: string, child: UiNode, index?: number) => void;
  appendChildOfType: (parentId: string, type: string) => void;
  /** Reorder a direct child among siblings (undoable). */
  reorderSibling: (parentId: string, activeId: string, overId: string) => void;
  /** Does nothing if `id` is the screen root. */
  removeNode: (id: string) => void;
  /** Deep-copy `id` as the next sibling (new ids). Selects the copy. No-op for screen root. */
  duplicateNode: (id: string) => void;
  /** New screen with stack + dropped component; becomes active. */
  addScreenFromPalette: (
    componentType: string,
    flowPosition: { x: number; y: number },
  ) => void;
  /** New screen from a registry template; becomes active. */
  addScreenFromTemplate: (
    templateId: ScreenTemplateId,
    flowPosition: { x: number; y: number },
  ) => void;
  /** Remove a screen (not the last one). */
  removeScreen: (screenId: string) => void;
  setFlowPositions: (positions: Record<string, { x: number; y: number }>) => void;
  setFlowEdges: (edges: PrototypeEdge[]) => void;
  connectScreens: (
    source: string,
    target: string,
    kind: PrototypeEdgeKind,
  ) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
};

const initialDocument = createInitialDocument(STACK_TYPE);

function commitDocumentChange(
  set: (
    partial:
      | Partial<Pick<DocumentState, "document" | "past" | "future" | "activeScreenId">>
      | ((state: DocumentState) => Partial<DocumentState>),
  ) => void,
  get: () => DocumentState,
  computeNext: (document: AiuiDocument) => AiuiDocument | null,
): void {
  const { document, past, activeScreenId } = get();
  const next = computeNext(document);
  if (!next || next === document) return;
  let nextActive = activeScreenId;
  if (!next.screens[nextActive]) {
    nextActive = next.initialScreenId;
  }
  set({
    past: truncatePast([...past, cloneDocument(document)]),
    future: [],
    document: next,
    activeScreenId: nextActive,
  });
  sanitizeSelection(next, nextActive);
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: initialDocument,
  activeScreenId: initialDocument.initialScreenId,
  past: [],
  future: [],

  setDocument: (document) => {
    const next = cloneDocument(document);
    let active = get().activeScreenId;
    if (!next.screens[active]) {
      active = next.initialScreenId;
    }
    set({ document: next, past: [], future: [], activeScreenId: active });
    sanitizeSelection(next, active);
  },

  setActiveScreenId: (screenId) => {
    const { document } = get();
    if (!document.screens[screenId]) return;
    set({ activeScreenId: screenId });
    useSelectionStore.getState().clearSelection();
  },

  setRoot: (root) => {
    const aid = get().activeScreenId;
    commitDocumentChange(set, get, (document) =>
      replaceActiveScreenRoot(document, aid, root),
    );
  },

  setDocumentState: (state) => {
    commitDocumentChange(set, get, (document) => {
      const next: AiuiDocument = { ...document };
      if (state === undefined || Object.keys(state).length === 0) {
        delete next.state;
      } else {
        next.state = { ...state };
      }
      return next;
    });
  },

  updateNode: (id, updater) => {
    const aid = get().activeScreenId;
    commitDocumentChange(set, get, (document) => {
      const root = document.screens[aid]?.root;
      if (!root) return null;
      const nextRoot = updateNodeById(root, id, updater);
      if (nextRoot === root) return null;
      return replaceActiveScreenRoot(document, aid, nextRoot);
    });
  },

  insertChild: (parentId, child, index) => {
    const aid = get().activeScreenId;
    commitDocumentChange(set, get, (document) => {
      const root = document.screens[aid]?.root;
      if (!root) return null;
      if (!findNodeById(root, parentId)) return null;
      const nextRoot = insertChildInTree(root, parentId, child, index);
      return replaceActiveScreenRoot(document, aid, nextRoot);
    });
  },

  appendChildOfType: (parentId, type) => {
    const child = createNodeFromType(type);
    get().insertChild(parentId, child);
  },

  reorderSibling: (parentId, activeId, overId) => {
    const aid = get().activeScreenId;
    commitDocumentChange(set, get, (document) => {
      const root = document.screens[aid]?.root;
      if (!root) return null;
      if (!findNodeById(root, parentId)) return null;
      const nextRoot = reorderSiblingInTree(
        root,
        parentId,
        activeId,
        overId,
      );
      if (nextRoot === root) return null;
      return replaceActiveScreenRoot(document, aid, nextRoot);
    });
  },

  removeNode: (id) => {
    const aid = get().activeScreenId;
    commitDocumentChange(set, get, (document) => {
      const root = document.screens[aid]?.root;
      if (!root || root.id === id) return null;
      const nextRoot = removeNodeById(root, id);
      if (!nextRoot || nextRoot === root) return null;
      return replaceActiveScreenRoot(document, aid, nextRoot);
    });
  },

  duplicateNode: (id) => {
    const aid = get().activeScreenId;
    let duplicatedId: string | null = null;
    commitDocumentChange(set, get, (document) => {
      const root = document.screens[aid]?.root;
      if (!root || root.id === id) return null;
      const node = findNodeById(root, id);
      if (!node) return null;
      const parent = findParentOf(root, id);
      if (!parent) return null;
      const copy = cloneUiSubtreeWithNewIds(node);
      duplicatedId = copy.id;
      const idx = (parent.children ?? []).findIndex((c) => c.id === id);
      const nextRoot = insertChildInTree(
        root,
        parent.id,
        copy,
        idx + 1,
      );
      if (nextRoot === root) return null;
      return replaceActiveScreenRoot(document, aid, nextRoot);
    });
    if (duplicatedId) useSelectionStore.getState().selectNode(duplicatedId);
  },

  addScreenFromPalette: (componentType, flowPosition) => {
    const screenId = `screen-${newNodeId()}`;
    const { document, past } = get();
    const stack = createNodeFromType(STACK_TYPE);
    const child = createNodeFromType(componentType);
    const root: UiNode = { ...stack, children: [child] };
    const positions = {
      ...(document.flowLayout?.positions ?? {}),
      [screenId]: flowPosition,
    };
    const next: AiuiDocument = {
      ...document,
      screens: {
        ...document.screens,
        [screenId]: { title: "Screen", root },
      },
      flowLayout: {
        positions,
        edges: document.flowLayout?.edges ?? [],
      },
    };
    set({
      past: truncatePast([...past, cloneDocument(document)]),
      future: [],
      document: next,
      activeScreenId: screenId,
    });
    useSelectionStore.getState().clearSelection();
    sanitizeSelection(next, screenId);
  },

  addScreenFromTemplate: (templateId, flowPosition) => {
    const screenId = `screen-${newNodeId()}`;
    const { document, past } = get();
    const root = buildScreenTemplateRoot(templateId);
    const positions = {
      ...(document.flowLayout?.positions ?? {}),
      [screenId]: flowPosition,
    };
    const next: AiuiDocument = {
      ...document,
      screens: {
        ...document.screens,
        [screenId]: {
          title: SCREEN_TEMPLATE_LABELS[templateId],
          root,
        },
      },
      flowLayout: {
        positions,
        edges: document.flowLayout?.edges ?? [],
      },
    };
    set({
      past: truncatePast([...past, cloneDocument(document)]),
      future: [],
      document: next,
      activeScreenId: screenId,
    });
    useSelectionStore.getState().clearSelection();
    sanitizeSelection(next, screenId);
  },

  removeScreen: (screenId) => {
    commitDocumentChange(set, get, (document) => {
      const ids = Object.keys(document.screens);
      if (ids.length <= 1) return null;
      if (!document.screens[screenId]) return null;

      const { [screenId]: _removed, ...restScreens } = document.screens;
      const positions = { ...(document.flowLayout?.positions ?? {}) };
      delete positions[screenId];
      const edges = (document.flowLayout?.edges ?? []).filter(
        (e) => e.source !== screenId && e.target !== screenId,
      );
      let initialScreenId = document.initialScreenId;
      if (initialScreenId === screenId) {
        initialScreenId = Object.keys(restScreens)[0] ?? DEFAULT_SCREEN_ID;
      }
      return {
        ...document,
        screens: restScreens,
        initialScreenId,
        flowLayout: { positions, edges },
      };
    });
  },

  setFlowPositions: (positions) => {
    commitDocumentChange(set, get, (document) => {
      const nextLayout: FlowLayout = {
        positions,
        edges: document.flowLayout?.edges ?? [],
      };
      return { ...document, flowLayout: nextLayout };
    });
  },

  setFlowEdges: (edges) => {
    commitDocumentChange(set, get, (document) => {
      const positions = document.flowLayout?.positions ?? {};
      return {
        ...document,
        flowLayout: { positions, edges },
      };
    });
  },

  connectScreens: (source, target, kind) => {
    if (source === target) return;
    commitDocumentChange(set, get, (document) => {
      const id = `edge-${newNodeId()}`;
      const edge: PrototypeEdge = { id, source, target, kind };
      const existing = document.flowLayout?.edges ?? [];
      if (existing.some((e) => e.source === source && e.target === target)) {
        return null;
      }
      const edges = [...existing, edge];
      let next: AiuiDocument = {
        ...document,
        flowLayout: {
          positions: document.flowLayout?.positions ?? {},
          edges,
        },
      };
      next = applyPrototypeEdgeToDocument(next, edge);
      return next;
    });
  },

  reset: () => {
    const doc = createInitialDocument(STACK_TYPE);
    set({
      document: doc,
      activeScreenId: doc.initialScreenId,
      past: [],
      future: [],
    });
    sanitizeSelection(doc, doc.initialScreenId);
  },

  undo: () => {
    const { past, future, document, activeScreenId } = get();
    if (past.length === 0) return;
    const newPast = [...past];
    const nextDoc = newPast.pop()!;
    let nextActive = activeScreenId;
    if (!nextDoc.screens[nextActive]) {
      nextActive = nextDoc.initialScreenId;
    }
    set({
      document: cloneDocument(nextDoc),
      past: newPast,
      future: truncateFuture([cloneDocument(document), ...future]),
      activeScreenId: nextActive,
    });
    sanitizeSelection(get().document, get().activeScreenId);
  },

  redo: () => {
    const { past, future, document, activeScreenId } = get();
    if (future.length === 0) return;
    const newFuture = [...future];
    const nextDoc = newFuture.shift()!;
    let nextActive = activeScreenId;
    if (!nextDoc.screens[nextActive]) {
      nextActive = nextDoc.initialScreenId;
    }
    set({
      document: cloneDocument(nextDoc),
      past: truncatePast([...past, cloneDocument(document)]),
      future: newFuture,
      activeScreenId: nextActive,
    });
    sanitizeSelection(get().document, get().activeScreenId);
  },
}));
