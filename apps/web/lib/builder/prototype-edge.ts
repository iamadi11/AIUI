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

function actionMatchesPrototypeEdge(action: Action, edge: PrototypeEdge): boolean {
  if (edge.kind === "modal") {
    return (
      action.type === "modal" &&
      action.action === "open" &&
      action.target === edge.target
    );
  }
  return (
    action.type === "navigateScreen" && action.screenId === edge.target
  );
}

/**
 * Removes the navigate/modal action for this edge from the previous trigger node's event list.
 */
function stripPrototypeActionFromTrigger(
  root: UiNode,
  triggerId: string,
  edge: PrototypeEdge,
): UiNode {
  const eventName = edge.event ?? "click";
  const updated = updateNodeById(root, triggerId, (n) => {
    const list = n.events?.[eventName];
    if (!list?.length) return n;
    const filtered = list.filter((a) => !actionMatchesPrototypeEdge(a, edge));
    const nextEvents = { ...n.events } as NonNullable<UiNode["events"]>;
    if (filtered.length === 0) {
      delete nextEvents[eventName];
    } else {
      nextEvents[eventName] = filtered;
    }
    const hasAny = Object.keys(nextEvents).length > 0;
    return {
      ...n,
      events: hasAny ? nextEvents : undefined,
    };
  });
  return updated;
}

/**
 * Updates `sourceNodeId` on a prototype edge and re-syncs `events` on the affected nodes.
 */
export function reassignPrototypeEdgeTrigger(
  doc: AiuiDocument,
  edgeId: string,
  nextSourceNodeId: string | undefined,
): AiuiDocument {
  const edges = doc.flowLayout?.edges ?? [];
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return doc;

  const sourceScreen = doc.screens[edge.source];
  if (!sourceScreen) return doc;

  const prevTriggerId =
    edge.sourceNodeId ?? findFirstDescendant(sourceScreen.root, BUTTON_TYPE)?.id;

  let nextDoc: AiuiDocument = doc;
  if (prevTriggerId) {
    const clearedRoot = stripPrototypeActionFromTrigger(
      sourceScreen.root,
      prevTriggerId,
      edge,
    );
    nextDoc = {
      ...nextDoc,
      screens: {
        ...nextDoc.screens,
        [edge.source]: { ...sourceScreen, root: clearedRoot },
      },
    };
  }

  const nextEdges = (nextDoc.flowLayout?.edges ?? []).map((e) =>
    e.id === edgeId ? { ...e, sourceNodeId: nextSourceNodeId } : e,
  );
  const positions = nextDoc.flowLayout?.positions ?? {};
  const patched: AiuiDocument = {
    ...nextDoc,
    flowLayout: { positions, edges: nextEdges },
  };

  const updatedEdge = nextEdges.find((e) => e.id === edgeId);
  if (!updatedEdge) return patched;

  return applyPrototypeEdgeToDocument(patched, updatedEdge);
}
