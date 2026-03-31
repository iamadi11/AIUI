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

- [x] **Data & state** sheet (`DataAndStateSheet`): navbar **Data & state** opens one place for initial state, sample source ids, and fetch→table starter (removed duplicate **Initial state** block from dev stack).
- [x] **Prepare state for fetch → table** button merges `getFetchTableStarterState()` (`table.rows`) to align with the interaction preset — no JSON required for that path.

## Phase 5 — Bindings

- [x] **Schema-first apply:** `validateBindingDescriptorSchema` (`binding-schema.ts`) runs on apply; draft preview shows **DSL** errors (destructive) then **sample** warnings (amber); Apply disabled until schema passes.
- [x] **Binding draft UI** remounts via `BindingDraftFields` `key` (no setState-in-effect); sample source/path lists include imported paths when needed.
- [x] **Golden JSON** round-trip test with **four** `BindingDescriptor` kinds on a nested node (`export-roundtrip.test.ts`).

## Phase 6 — Actions and CTAs

- [x] **Templates** block in Properties → Actions (registry `interactionPresets`); copy explains replace-on-duplicate-event behavior.
- [x] **Step order** in visual mode: numbered steps (Step 1…n), reorder on every step type including **If**; move/remove control titles i18n.
- [x] **Advanced** surfaces: full **Logic map** + JSON **Flow preview** under the editor require **`?dev=1`** (hint copy + gated mini-graph).

## Phase 7 — Hardening

- [x] **Diagnostics + MCP:** `docs/mcp/debug-mcp-spec.md` **0.2.2** — tools tied to `packages/debug-mcp`, diagnostics panel uses same telemetry fields + i18n; redaction policy unchanged (`issue-telemetry.ts`).
- [x] **i18n:** Performance summaries/guardrails via `perfSummary` + `guardrailIds` (`document-performance.ts`) + `document-performance-ui.ts`; diagnostics panel, large-doc banner, Suspense fallback, viewport parity copy localized.
- [x] **a11y:** Navbar **More** uses `aria-label`; inspector **ScrollArea** labeled; main workspace **min height** on small viewports (`min(42dvh,640px)`, `lg:min-h-0` for flex).

## Phase 8+ — Multi-screen (optional)

- [ ] If product needs it: reconcile **screen graph** with single-page clarity (mode switch or secondary entry); avoid confusing single-page users.

---

## Done (meta)

- [x] **2026-04** — Reset roadmap in [`PLAN.md`](PLAN.md) for **React Flow = one page**, **DnD-first dashboard**, **preview parity**, phased plan documented.
- [x] **2026-04** — Phase 0 doc alignment: `core.md`, `cursor.md`, `apps/web/README.md`, `aiui-platform` skill updated to match.
