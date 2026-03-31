# `@aiui/registry`

Component **definitions** for the builder and any host that maps `UiNode.type` to UI behavior.

## UX metadata standard

Each `ComponentDefinition` must provide `ux` metadata:

- **`ux.palette.category`** — One of `layout` | `input` | `data` | `display` | `advanced` (see `PALETTE_CATEGORY_ORDER` in `src/index.ts`).
- **`ux.palette.keywords`** — Optional search tokens (display name and `type` are always searched).
- **`ux.palette.description`** — Short subtitle in the builder palette.
- **`ux.inspector.fields`** — Standard inspector field descriptors used by properties UI.
- **`ux.inspector.defaultSection` / `sectionOrder`** — Beginner-first section hints for inspector rendering.
- **`ux.capabilities`** — Feature affordance contract (`supportsDataSource`, `supportsActions`, etc).

Helpers:

- `listPaletteDefinitions()` — Primitives sorted by category, then display name.
- `matchesPaletteSearch(def, query)` — Whitespace-separated tokens; all must match substrings in name, type, keywords, or description.
- `getPaletteMeta(type)` — Read standardized palette metadata for a primitive.

**Inspector `scope`:** Fields can set `scope: "layout"` so the builder writes to `node.layout` (e.g. `padding`, `width`, `height`) instead of `props`, aligned with `@aiui/layout-engine`. Use `kind: "marginSides"` for per-side `layout.margin` (`{ top, right, bottom, left }`).

Adding a primitive: register it in `primitives`, set `ux.palette` and `ux.inspector` metadata so palette and inspector behavior stay discoverable without hardcoded lists in `apps/web`.
