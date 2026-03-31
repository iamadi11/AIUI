import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import {
  DEFAULT_SCREEN_ID,
  DSL_VERSION,
  LAYOUT_VERSION,
} from "@aiui/dsl-schema";
import { getDefinition } from "@aiui/registry";
import { newNodeId } from "@/lib/id";

/**
 * Fixed id for the default document root so the initial Zustand state matches
 * between server render and client hydration (random ids in module scope break SSR).
 */
export const INITIAL_DOCUMENT_ROOT_ID = "a0000000-0000-4000-8000-000000000001";

/** Deep-copy a node and subtree with fresh ids (for duplicate / template expansion). */
export function cloneUiSubtreeWithNewIds(node: UiNode): UiNode {
  return {
    ...node,
    id: newNodeId(),
    children: node.children?.map(cloneUiSubtreeWithNewIds),
  };
}

export function createNodeFromType(
  type: string,
  options?: { id?: string },
): UiNode {
  const def = getDefinition(type);
  if (!def) {
    throw new Error(`Unknown component type: ${type}`);
  }
  const base: UiNode = {
    id: options?.id ?? newNodeId(),
    type: def.type,
    props: { ...def.defaultProps },
  };
  if (!def.defaultChildren?.length) return base;
  return {
    ...base,
    children: def.defaultChildren.map(cloneUiSubtreeWithNewIds),
  };
}

export function createInitialDocument(rootType: string): AiuiDocument {
  const root = createNodeFromType(rootType, { id: INITIAL_DOCUMENT_ROOT_ID });
  return {
    version: DSL_VERSION,
    layoutVersion: LAYOUT_VERSION,
    initialScreenId: DEFAULT_SCREEN_ID,
    screens: {
      [DEFAULT_SCREEN_ID]: { title: "Home", root },
    },
    flowLayout: {
      positions: { [DEFAULT_SCREEN_ID]: { x: 0, y: 0 } },
      edges: [],
    },
  };
}

export { DEFAULT_SCREEN_ID };

/** Deep clone for undo/redo snapshots (JSON-safe document shape). */
export function cloneDocument(doc: AiuiDocument): AiuiDocument {
  return structuredClone(doc);
}
