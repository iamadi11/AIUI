# AIUI — Execution backlog

Tracks the roadmap in [`PLAN.md`](PLAN.md). Phase checklist below is **complete**; use git history for granular completion notes before 2026-04-01.

## Phase checklist (0–8)

All items below are done unless marked otherwise.

- [x] **Phase 0** — Canonical `PLAN.md` / `TODO.md` / `cursor.md` / `core.md`; MCP spec bootstrapped.
- [x] **Phase 1** — Registry UX metadata; DnD affordances; beginner inspector; templates + walkthrough.
- [x] **Phase 2** — Responsive layout schema; viewport presets; overflow warnings; parity across presets.
- [x] **Phase 3** — Binding descriptors; data picker; sample preview; reusable field editors; validation UX.
- [x] **Phase 4** — Action list + React Flow; fetch/transform/modal/notify/etc.; scenario templates; visibility rules.
- [x] **Phase 5** — Single `RuntimeSurface` path; visual snapshots; preview chrome toggle; dev parity diagnostics.
- [x] **Phase 6** — Adapter interface; capability schema + validator; certification checklist; onboarding guide.
- [x] **Phase 7** — Issue telemetry; diagnostics panel; `@aiui/debug-mcp`; redaction; safe-fix guardrails.
- [x] **Phase 8** — Onboarding; migration assistant; large-doc guardrails; a11y; i18n message keys.

## Recently completed (2026-03-31)

- **Add screen from template:** Builder screen graph toolbar includes a select fed by [`SCREEN_TEMPLATE_LABELS`](packages/registry/src/screen-templates.ts); [`screen-template-builders.ts`](apps/web/lib/builder/screen-template-builders.ts) composes starter trees (dashboard / stacked / table+modal); `addScreenFromTemplate` + `centerFlowPosition` on the flow ref place the new node near the graph center.
- **Multi-screen DSL + screen graph:** Documents use `screens`, `initialScreenId`, and `flowLayout` (positions + prototype edges); migration wraps legacy `root`; builder adds **React Flow** screen nodes, palette drop to create screens, connect edges (navigate/modal) with actions synced via `applyPrototypeEdgeToDocument`; runtime supports `navigateScreen`, modal stack, and overlay; `navigateScreen` action + `editorDocumentView` for per-screen editing; registry [`screen-templates.ts`](packages/registry/src/screen-templates.ts) for future template labels.
- Builder shell: **sidebar palette** (left), slim **navbar** (Preview + More); **`/?dev=1`** adds **Design / Logic** tabs (React Flow logic map + dev panels), tree, export, diagnostics, live JSON; **Advanced** → `/?dev=1` from default route.
- **Preview** (`/preview`): download / copy / import JSON; **Edit** → `/`; optional **Developer preview** → `?dev=1`.
- Shared **golden JSON** export logic: [`apps/web/lib/builder/golden-document-export.ts`](apps/web/lib/builder/golden-document-export.ts), [`use-golden-document-export.ts`](apps/web/lib/builder/use-golden-document-export.ts).
- **Runtime** (`@aiui/runtime-core`): paints labels and sample table UI for Button, Input, Badge, Card (leaf), Table (leaf or title overlay when composed).
- **Registry**: `defaultChildren` starter trees for Card and Table; `interactionPresets` on Button and Table; Events panel uses presets when present.
- **Canvas**: right-click menu (configure / duplicate / remove non-root).

## Next (optional)

- [ ] Optional React shadcn renderer path if imperative DOM is not enough for visual parity.
- [ ] Extend `interactionPresets` across more primitives and tune copy.
- [ ] Visual events editor: `navigateScreen` step (screen picker) alongside URL navigate; edge inspector to pick trigger node when multiple buttons exist.
