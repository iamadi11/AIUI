import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { DEFAULT_SCREEN_ID } from "@aiui/dsl-schema";

/**
 * Minimal document for an isolated runtime preview of one subtree (e.g. page graph node).
 * Copies document version and optional `state` so bindings/samples behave like the main doc.
 */
export function previewDocumentForSubtree(
  base: Pick<AiuiDocument, "version" | "layoutVersion"> & {
    state?: AiuiDocument["state"];
  },
  subtree: UiNode,
): AiuiDocument {
  return {
    version: base.version,
    layoutVersion: base.layoutVersion,
    ...(base.state !== undefined ? { state: base.state } : {}),
    initialScreenId: DEFAULT_SCREEN_ID,
    screens: {
      [DEFAULT_SCREEN_ID]: {
        title: "Preview",
        root: structuredClone(subtree),
      },
    },
    flowLayout: {
      positions: {},
      edges: [],
    },
  };
}
