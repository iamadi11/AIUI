# Builder vs preview parity

## Runtime path

- Both the **builder canvas** and **`/preview`** render through `RuntimeSurface` → `AiuiRuntime` → `@aiui/runtime-core` `render()`.
- The **viewport frame** (max width, padding, `min-h`) is shared via `RuntimePreviewHost` (`components/preview/runtime-preview-host.tsx`), used by:
  - `RuntimePreview` (the `/preview` page)
  - `BuilderCanvas` (desktop preset, `hideChrome`; `ref` on the centered column matches layout overlay measurement)

## Active screen in the builder

`runtime-core` resets the internal route to `document.initialScreenId` on each `update()`. The builder edits whichever screen is **active** in the document store, which may differ from `initialScreenId` when multiple screens exist.

The builder passes a **non-mutating** copy from `runtimeDocumentForActiveEditorScreen(document, activeScreenId)` so the canvas shows the **edited** screen. Export and `/preview` continue to use the persisted `initialScreenId` as the first-load route.

## Manual smoke checklist

1. Open the builder, add content, open **`/preview`** (default chrome off).
2. Compare layout at **desktop** width: structure and spacing should match aside from builder-only chrome (selection, dashed frame, labels).
3. With **two screens**, switch the active screen in the graph and confirm the canvas updates to that screen’s tree.
4. Optional: open **`/preview?dev=1`**, pick **Desktop** viewport, and compare to the builder canvas.
