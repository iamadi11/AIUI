# `@aiui/registry`

Component **definitions** for the builder and any host that maps `UiNode.type` to UI behavior.

## Palette metadata

Each `ComponentDefinition` includes:

- **`paletteCategory`** — One of `layout` | `input` | `data` | `display` | `advanced` (see `PALETTE_CATEGORY_ORDER` in `src/index.ts`).
- **`paletteKeywords`** — Optional search tokens (display name and `type` are always searched).
- **`paletteDescription`** — Short subtitle in the builder palette.

Helpers:

- `listPaletteDefinitions()` — Primitives sorted by category, then display name.
- `matchesPaletteSearch(def, query)` — Whitespace-separated tokens; all must match substrings in name, type, keywords, or description.

**Inspector `scope`:** Fields can set `scope: "layout"` so the builder writes to `node.layout` (e.g. `padding`, `width`, `height`) instead of `props`, aligned with `@aiui/layout-engine`.

Adding a primitive: register it in `primitives`, set `paletteCategory` and optional keywords/description so the palette stays discoverable without hardcoding lists in `apps/web`.
