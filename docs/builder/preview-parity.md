# Builder vs preview parity

## Runtime path

- **`/preview`** renders through `RuntimeSurface` → `AiuiRuntime` → `@aiui/runtime-core` `render()`.
- The **viewport frame** (max width, padding, `min-h`) is shared via `RuntimePreviewHost` (`components/preview/runtime-preview-host.tsx`), used by:
  - `RuntimePreview` (the `/preview` page)
- The **builder primary workspace** is the **page graph** (`PageFlowCanvas`): React Flow + per-node `ShadcnNodePreview` (data-driven React/shadcn previews). It does **not** mount the full runtime in the main editor.

## When to compare “builder” vs preview

Use **`/preview`** (or export) as the canonical **runtime** output for the same document JSON. The graph is a **structure + props** editor; the runtime canvas is still the source of truth for layout-engine pixels and interactions.

## Active screen in the builder

`runtime-core` resets the internal route to `document.initialScreenId` on each `update()`. The builder edits whichever screen is **active** in the document store, which may differ from `initialScreenId` when multiple screens exist.

Preview and export use `runtimeDocumentForActiveEditorScreen` only when embedding runtime in a host; the graph does not depend on that shim.

## Manual smoke checklist

1. Build structure in the **page graph** (palette drops, selection).
2. Open **`/preview`** with the same document and compare **desktop** width: tree should reflect the same DSL.
3. With **two screens**, switch the active screen in the screen map and confirm **`/preview`** / export targets the intended screen routing rules.
