# `@aiui/registry`

Component **definitions** for the builder and any host that maps `UiNode.type` to UI behavior.

## Adapter interface (Phase 6 baseline)

`@aiui/registry` exports a formal `UiAdapterDefinition` contract for UI-library integrations:

- `id`, `displayName`, `packageName`, `version`
- `supportedTypes`
- `getDefinition(type)`
- `listDefinitions()`

The default production adapter is `SHADCN_ADAPTER` (`id: "shadcn"`), which exposes the current primitive registry.
Future component libraries must plug in through this interface instead of adding app-level hardcoded mappings.

## Capability schema and validator

Capability metadata is standardized by `COMPONENT_CAPABILITY_SCHEMA` and validated by:

- `validateComponentCapabilities(value)` — validates raw capability objects.
- `validateCapabilitiesForType(type)` — validates capability metadata for a registered component type.

Validation catches:

- invalid field types
- unsupported `supportedLayoutModes` values
- inconsistent capability combinations (e.g. `supportsRowActions: true` while `supportsActions: false`)

## Certification gate

Before exposing adapter components to end users, run the certification checklist:

- `docs/adapters/component-certification-checklist.md`
- `docs/adapters/adapter-onboarding-guide.md` (full integration flow)

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

## Drop-in subtrees and action presets

- **`defaultChildren`:** Optional `UiNode[]` template on a `ComponentDefinition`. When the builder creates a node with `createNodeFromType`, each template subtree is cloned with fresh ids (`cloneUiSubtreeWithNewIds`). Use this for composed starters (e.g. Card/Table with toolbar, body, pagination regions as nested layout nodes).
- **`ux.capabilities.interactionPresets`:** Optional list of `InteractionPreset` entries (`id`, `label`, `eventName`, `templateKey`). The builder maps `templateKey` to concrete `Action[]` in the app so users get one-click side-effect starters without raw JSON first.
