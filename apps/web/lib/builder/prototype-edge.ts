import type { Action, AiuiDocument, PrototypeEdge } from "@aiui/dsl-schema";
import { BUTTON_TYPE } from "@aiui/registry";
import type { UiNode } from "@aiui/dsl-schema";
import { updateNodeById } from "@/lib/document/tree";

function findFirstDescendant(root: UiNode, type: string): UiNode | undefined {
  if (root.type === type) return root;
  for (const c of root.children ?? []) {
    const f = findFirstDescendant(c, type);
    if (f) return f;
  }
  return undefined;
}

/**
 * Writes prototype navigation/modal actions onto the source screen's trigger node
 * (first Button if `sourceNodeId` is omitted).
 */
export function applyPrototypeEdgeToDocument(
  doc: AiuiDocument,
  edge: PrototypeEdge,
): AiuiDocument {
  const sourceScreen = doc.screens[edge.source];
  if (!sourceScreen) return doc;
  const sourceRoot = sourceScreen.root;
  const triggerNodeId =
    edge.sourceNodeId ?? findFirstDescendant(sourceRoot, BUTTON_TYPE)?.id;
  if (!triggerNodeId) return doc;

  const action: Action =
    edge.kind === "modal"
      ? { type: "modal", action: "open", target: edge.target }
      : { type: "navigateScreen", screenId: edge.target };

  const newRoot = updateNodeById(sourceRoot, triggerNodeId, (n) => ({
    ...n,
    events: {
      ...n.events,
      [edge.event ?? "click"]: [action],
    },
  }));
  if (newRoot === sourceRoot) return doc;

  const targetScreen = doc.screens[edge.target];
  const nextScreens = {
    ...doc.screens,
    [edge.source]: { ...sourceScreen, root: newRoot },
  };
  if (targetScreen && edge.kind === "modal") {
    nextScreens[edge.target] = {
      ...targetScreen,
      role: "modal",
    };
  }
  return { ...doc, screens: nextScreens };
}
