"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { findParentOf } from "@/lib/document/tree";
import { useEffect } from "react";

type UseBuilderShortcutsArgs = {
  documentRoot: UiNode;
  selectedIds: string[];
  selectedNodeId: string | null;
  rootId: string;
  undo: () => void;
  redo: () => void;
  duplicateNode: (id: string) => void;
  removeNode: (id: string) => void;
  setSelection: (ids: string[]) => void;
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
};

function collectNodeIds(root: UiNode): string[] {
  const ids: string[] = [];
  function walk(node: UiNode) {
    ids.push(node.id);
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return ids;
}

export function useBuilderShortcuts(args: UseBuilderShortcutsArgs): void {
  const {
    documentRoot,
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
  } = args;

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
        setSelection(collectNodeIds(documentRoot));
        return;
      }
      if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault();
        if (!selectedNodeId) return;
        const parent = findParentOf(documentRoot, selectedNodeId);
        if (parent) selectNode(parent.id);
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
    selectNode,
    duplicateNode,
    removeNode,
    selectedIds,
    selectedNodeId,
    rootId,
    documentRoot,
  ]);
}
