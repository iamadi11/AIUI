import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { create } from "zustand";
import { createInitialDocument, createNodeFromType } from "@/lib/document/model";
import {
  findNodeById,
  insertChild as insertChildInTree,
  removeNodeById,
  updateNodeById,
} from "@/lib/document/tree";
import { STACK_TYPE } from "@aiui/registry";

type DocumentState = {
  document: AiuiDocument;
  setDocument: (document: AiuiDocument) => void;
  setRoot: (root: UiNode) => void;
  updateNode: (id: string, updater: (node: UiNode) => UiNode) => void;
  insertChild: (parentId: string, child: UiNode, index?: number) => void;
  appendChildOfType: (parentId: string, type: string) => void;
  /** Does nothing if `id` is the document root. */
  removeNode: (id: string) => void;
  reset: () => void;
};

const initialDocument = createInitialDocument(STACK_TYPE);

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: initialDocument,

  setDocument: (document) => set({ document }),

  setRoot: (root) =>
    set((s) => ({
      document: { ...s.document, root },
    })),

  updateNode: (id, updater) => {
    const { document } = get();
    const nextRoot = updateNodeById(document.root, id, updater);
    if (nextRoot === document.root) return;
    set({ document: { ...document, root: nextRoot } });
  },

  insertChild: (parentId, child, index) => {
    const { document } = get();
    if (!findNodeById(document.root, parentId)) return;
    const nextRoot = insertChildInTree(document.root, parentId, child, index);
    set({ document: { ...document, root: nextRoot } });
  },

  appendChildOfType: (parentId, type) => {
    const child = createNodeFromType(type);
    get().insertChild(parentId, child);
  },

  removeNode: (id) => {
    const { document } = get();
    if (document.root.id === id) return;
    const nextRoot = removeNodeById(document.root, id);
    if (!nextRoot || nextRoot === document.root) return;
    set({ document: { ...document, root: nextRoot } });
  },

  reset: () => set({ document: createInitialDocument(STACK_TYPE) }),
}));
