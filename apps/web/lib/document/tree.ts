import type { UiNode } from "@aiui/dsl-schema";

export function findNodeById(root: UiNode, id: string): UiNode | null {
  if (root.id === id) return root;
  if (!root.children?.length) return null;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/** Path from root to `id` (inclusive), or `null` if not found. */
export function getPathToNode(root: UiNode, id: string): UiNode[] | null {
  if (root.id === id) return [root];
  if (!root.children?.length) return null;
  for (const child of root.children) {
    const sub = getPathToNode(child, id);
    if (sub) return [root, ...sub];
  }
  return null;
}

/** Returns parent of `id`, or `null` if `id` is the root or missing. */
export function findParentOf(root: UiNode, id: string): UiNode | null {
  if (root.id === id) return null;
  if (!root.children?.length) return null;
  for (const child of root.children) {
    if (child.id === id) return root;
    const p = findParentOf(child, id);
    if (p) return p;
  }
  return null;
}

export function updateNodeById(
  root: UiNode,
  id: string,
  updater: (node: UiNode) => UiNode,
): UiNode {
  if (root.id === id) return updater(root);
  if (!root.children?.length) return root;
  let changed = false;
  const children = root.children.map((child) => {
    const next = updateNodeById(child, id, updater);
    if (next !== child) changed = true;
    return next;
  });
  if (!changed) return root;
  return { ...root, children };
}

export function insertChild(
  root: UiNode,
  parentId: string,
  child: UiNode,
  index?: number,
): UiNode {
  return updateNodeById(root, parentId, (node) => {
    const prev = node.children ?? [];
    const next = [...prev];
    const i = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
    next.splice(i, 0, child);
    return { ...node, children: next };
  });
}

/** Removes the node with `id`. Returns `null` if `root` was removed. */
export function removeNodeById(root: UiNode, id: string): UiNode | null {
  if (root.id === id) return null;
  const prev = root.children;
  if (!prev?.length) return root;
  const nextChildren = prev
    .map((c) => removeNodeById(c, id))
    .filter((c): c is UiNode => c !== null);
  if (
    nextChildren.length === prev.length &&
    nextChildren.every((c, i) => c === prev[i])
  ) {
    return root;
  }
  return { ...root, children: nextChildren };
}
