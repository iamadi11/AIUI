import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { create } from "zustand";
import {
  cloneDocument,
  createInitialDocument,
  createNodeFromType,
} from "@/lib/document/model";
import {
  findNodeById,
  insertChild as insertChildInTree,
  removeNodeById,
  updateNodeById,
} from "@/lib/document/tree";
import { useSelectionStore } from "@/stores/selection-store";
import { STACK_TYPE } from "@aiui/registry";

const MAX_HISTORY = 50;

function truncatePast(past: AiuiDocument[]): AiuiDocument[] {
  if (past.length <= MAX_HISTORY) return past;
  return past.slice(past.length - MAX_HISTORY);
}

function truncateFuture(future: AiuiDocument[]): AiuiDocument[] {
  if (future.length <= MAX_HISTORY) return future;
  return future.slice(0, MAX_HISTORY);
}

function sanitizeSelection(document: AiuiDocument) {
  const selectedId = useSelectionStore.getState().selectedNodeId;
  if (selectedId && !findNodeById(document.root, selectedId)) {
    useSelectionStore.getState().selectNode(null);
  }
}

type DocumentState = {
  document: AiuiDocument;
  past: AiuiDocument[];
  future: AiuiDocument[];
  setDocument: (document: AiuiDocument) => void;
  setRoot: (root: UiNode) => void;
  updateNode: (id: string, updater: (node: UiNode) => UiNode) => void;
  insertChild: (parentId: string, child: UiNode, index?: number) => void;
  appendChildOfType: (parentId: string, type: string) => void;
  /** Does nothing if `id` is the document root. */
  removeNode: (id: string) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
};

const initialDocument = createInitialDocument(STACK_TYPE);

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: initialDocument,
  past: [],
  future: [],

  setDocument: (document) => {
    const next = cloneDocument(document);
    set({ document: next, past: [], future: [] });
    sanitizeSelection(next);
  },

  setRoot: (root) => {
    const { document, past } = get();
    const next = { ...document, root };
    set({
      past: truncatePast([...past, cloneDocument(document)]),
      future: [],
      document: next,
    });
    sanitizeSelection(next);
  },

  updateNode: (id, updater) => {
    const { document, past } = get();
    const nextRoot = updateNodeById(document.root, id, updater);
    if (nextRoot === document.root) return;
    set({
      past: truncatePast([...past, cloneDocument(document)]),
      future: [],
      document: { ...document, root: nextRoot },
    });
  },

  insertChild: (parentId, child, index) => {
    const { document, past } = get();
    if (!findNodeById(document.root, parentId)) return;
    const nextRoot = insertChildInTree(document.root, parentId, child, index);
    set({
      past: truncatePast([...past, cloneDocument(document)]),
      future: [],
      document: { ...document, root: nextRoot },
    });
  },

  appendChildOfType: (parentId, type) => {
    const child = createNodeFromType(type);
    get().insertChild(parentId, child);
  },

  removeNode: (id) => {
    const { document, past } = get();
    if (document.root.id === id) return;
    const nextRoot = removeNodeById(document.root, id);
    if (!nextRoot || nextRoot === document.root) return;
    set({
      past: truncatePast([...past, cloneDocument(document)]),
      future: [],
      document: { ...document, root: nextRoot },
    });
  },

  reset: () => {
    set({
      document: createInitialDocument(STACK_TYPE),
      past: [],
      future: [],
    });
    sanitizeSelection(get().document);
  },

  undo: () => {
    const { past, future, document } = get();
    if (past.length === 0) return;
    const newPast = [...past];
    const nextDoc = newPast.pop()!;
    set({
      document: cloneDocument(nextDoc),
      past: newPast,
      future: truncateFuture([cloneDocument(document), ...future]),
    });
    sanitizeSelection(get().document);
  },

  redo: () => {
    const { past, future, document } = get();
    if (future.length === 0) return;
    const newFuture = [...future];
    const nextDoc = newFuture.shift()!;
    set({
      document: cloneDocument(nextDoc),
      past: truncatePast([...past, cloneDocument(document)]),
      future: newFuture,
    });
    sanitizeSelection(get().document);
  },
}));
