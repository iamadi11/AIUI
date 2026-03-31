import type { AiuiDocument } from "@aiui/dsl-schema";

/**
 * Runtime resets `currentScreenId` to `document.initialScreenId` on each
 * `update()`. For the builder canvas we need the **edited** screen rendered,
 * without mutating the persisted document (export / preview load screen stay
 * correct).
 */
export function runtimeDocumentForActiveEditorScreen(
  doc: AiuiDocument,
  activeScreenId: string,
): AiuiDocument {
  if (!doc.screens[activeScreenId]) return doc;
  if (doc.initialScreenId === activeScreenId) return doc;
  return { ...doc, initialScreenId: activeScreenId };
}
