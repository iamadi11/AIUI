import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { create } from "zustand";
import {
  cloneDocument,
  cloneUiSubtreeWithNewIds,
  createInitialDocument,
  createNodeFromType,
} from "@/lib/document/model";
import {
  findNodeById,
  findParentOf,
  insertChild as insertChildInTree,
  removeNodeById,
  reorderSibling as reorderSiblingInTree,
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
  useSelectionStore
    .getState()
    .reconcileSelection((id) => !!findNodeById(document.root, id));
}

type DocumentState = {
  document: AiuiDocument;
  past: AiuiDocument[];
  future: AiuiDocument[];
  setDocument: (document: AiuiDocument) => void;
  setRoot: (root: UiNode) => void;
  /** Replace document `state` (initial logic state). Pass `undefined` or `{}` to clear. */
  setDocumentState: (state: Record<string, unknown> | undefined) => void;
  updateNode: (id: string, updater: (node: UiNode) => UiNode) => void;
  insertChild: (parentId: string, child: UiNode, index?: number) => void;
  appendChildOfType: (parentId: string, type: string) => void;
  /** Reorder a direct child among siblings (undoable). */
  reorderSibling: (parentId: string, activeId: string, overId: string) => void;
  /** Does nothing if `id` is the document root. */
  removeNode: (id: string) => void;
  /** Deep-copy `id` as the next sibling (new ids). Selects the copy. No-op for root. */
  duplicateNode: (id: string) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
};

const initialDocument = createInitialDocument(STACK_TYPE);

function commitDocumentChange(
  set: (
    partial:
      | Partial<Pick<DocumentState, "document" | "past" | "future">>
      | ((state: DocumentState) => Partial<DocumentState>),
  ) => void,
  get: () => DocumentState,
  computeNext: (document: AiuiDocument) => AiuiDocument | null,
): void {
  const { document, past } = get();
  const next = computeNext(document);
  if (!next || next === document) return;
  set({
    past: truncatePast([...past, cloneDocument(document)]),
    future: [],
    document: next,
  });
  sanitizeSelection(next);
}

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
    commitDocumentChange(set, get, (document) => ({ ...document, root }));
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
    commitDocumentChange(set, get, (document) => {
      const nextRoot = updateNodeById(document.root, id, updater);
      if (nextRoot === document.root) return null;
      return { ...document, root: nextRoot };
    });
  },

  insertChild: (parentId, child, index) => {
    commitDocumentChange(set, get, (document) => {
      if (!findNodeById(document.root, parentId)) return null;
      const nextRoot = insertChildInTree(document.root, parentId, child, index);
      return { ...document, root: nextRoot };
    });
  },

  appendChildOfType: (parentId, type) => {
    const child = createNodeFromType(type);
    get().insertChild(parentId, child);
  },

  reorderSibling: (parentId, activeId, overId) => {
    commitDocumentChange(set, get, (document) => {
      if (!findNodeById(document.root, parentId)) return null;
      const nextRoot = reorderSiblingInTree(
        document.root,
        parentId,
        activeId,
        overId,
      );
      if (nextRoot === document.root) return null;
      return { ...document, root: nextRoot };
    });
  },

  removeNode: (id) => {
    commitDocumentChange(set, get, (document) => {
      if (document.root.id === id) return null;
      const nextRoot = removeNodeById(document.root, id);
      if (!nextRoot || nextRoot === document.root) return null;
      return { ...document, root: nextRoot };
    });
  },

  duplicateNode: (id) => {
    let duplicatedId: string | null = null;
    commitDocumentChange(set, get, (document) => {
      if (document.root.id === id) return null;
      const node = findNodeById(document.root, id);
      if (!node) return null;
      const parent = findParentOf(document.root, id);
      if (!parent) return null;
      const copy = cloneUiSubtreeWithNewIds(node);
      duplicatedId = copy.id;
      const idx = (parent.children ?? []).findIndex((c) => c.id === id);
      const nextRoot = insertChildInTree(
        document.root,
        parent.id,
        copy,
        idx + 1,
      );
      if (nextRoot === document.root) return null;
      return { ...document, root: nextRoot };
    });
    if (duplicatedId) useSelectionStore.getState().selectNode(duplicatedId);
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
