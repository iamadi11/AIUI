# AIUI — Execution backlog

Tracks the **current** phased roadmap in [`PLAN.md`](PLAN.md) (north star: **single-page, full-window React Flow canvas**, **drag-and-drop structure**, **preview parity**).

## Legacy completion (reference)

The **previous** phase checklist **0–8** (registry, layout, bindings, actions, parity, adapters, MCP, onboarding) is **done** in code; see **“Legacy roadmap”** at the bottom of [`PLAN.md`](PLAN.md). This file lists **forward work** for the **2026-04 dashboard revamp**.

---

## Phase 0 — Plan alignment

- [x] Confirm single-page primary scope; multi-screen explicitly deferred to Phase 8+ in [`PLAN.md`](PLAN.md).
- [x] Ensure `core.md`, `cursor.md`, `apps/web/README.md`, and `.cursor/skills/aiui-platform/SKILL.md` match [`PLAN.md`](PLAN.md) (no contradictory builder descriptions).

## Phase 1 — Full-window page canvas

- [x] **Single-page mode** (`screens.length === 1`): hide the **screen graph** (React Flow); the **page canvas** (`BuilderCanvas` / runtime surface) uses the **full workspace** below the optional dev/perf rows.
- [x] **Multi-screen mode**: vertical split defaults to **~22% screen map / ~78% page canvas** (was 40/60) so composition stays dominant.
- [x] When the graph is hidden, **add another screen** via the **template** dropdown + short hint; palette → **page canvas** remains the primary DnD path for components.
- [ ] **Follow-up:** true “components on a React Flow canvas” (spatial node graph for the page tree) is a larger architectural step — see [`PLAN.md`](PLAN.md) if/when prioritized over the current runtime canvas.

## Phase 2 — Preview parity

- [x] Builder canvas uses **`RuntimePreviewHost`** (same DOM/CSS as `/preview` default path: desktop width cap, `p-4`, `min-h-[140px]`).
- [x] **`runtimeDocumentForActiveEditorScreen`** so the runtime shows the **active** editor screen (non-mutating `initialScreenId` shim); export / preview keep persisted routing.
- [x] Manual checklist: [`docs/builder/preview-parity.md`](docs/builder/preview-parity.md).
- [ ] **Optional:** automated visual or layout snapshot test (builder vs preview) in CI.

## Phase 3 — Props on drop + lean inspector

- [x] **`defaultLayout`** on `ComponentDefinition`; merged in `createNodeFromType` (`apps/web/lib/document/model.ts`). Palette primitives (Button, Input, Card, Table, Badge) set spacing defaults.
- [x] **Inspector:** hide **Width/Height** layout controls when the node **has children** (those fields apply to empty leaves only). Shorten displayed **node id** with full id in `title` tooltip.

## Phase 4 — State and data UX

- [ ] Single clear story for **document state** + **data sources** (no duplicate panels).
- [ ] Happy-path **fetch → populate** without JSON for standard templates.

## Phase 5 — Bindings

- [ ] Binding authoring matches runtime `kind` model; validation UX next to controls.
- [ ] Export/import round-trip tests for binding scenarios used in demos.

## Phase 6 — Actions and CTAs

- [ ] **Action templates** and step ordering in visual mode for non-technical users.
- [ ] **Advanced** logic graph remains optional (`?dev=1` or equivalent).

## Phase 7 — Hardening

- [ ] Diagnostics + MCP docs in sync with behavior; redaction unchanged unless envelopes change.
- [ ] i18n keys for new copy; a11y spot-check on builder shell; large-doc responsiveness.

## Phase 8+ — Multi-screen (optional)

- [ ] If product needs it: reconcile **screen graph** with single-page clarity (mode switch or secondary entry); avoid confusing single-page users.

---

## Done (meta)

- [x] **2026-04** — Reset roadmap in [`PLAN.md`](PLAN.md) for **React Flow = one page**, **DnD-first dashboard**, **preview parity**, phased plan documented.
- [x] **2026-04** — Phase 0 doc alignment: `core.md`, `cursor.md`, `apps/web/README.md`, `aiui-platform` skill updated to match.
