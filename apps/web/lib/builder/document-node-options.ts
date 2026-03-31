import type { UiNode } from "@aiui/dsl-schema";
import { formatNodeTitle } from "@/lib/builder/node-display";

export type DocumentNodeOption = { id: string; label: string };

/** Flat list of every node in the tree for pickers (modal targets, etc.). */
export function listDocumentNodesForPicker(root: UiNode): DocumentNodeOption[] {
  const out: DocumentNodeOption[] = [];
  function walk(node: UiNode) {
    out.push({ id: node.id, label: formatNodeTitle(node) });
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return out;
}
