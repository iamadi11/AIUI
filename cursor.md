# Cursor Handbook - AIUI

This handbook defines durable rules for contributors and agents.

## What AIUI is building

AIUI is a no-code dashboard builder for non-technical users.
The output is a versioned JSON DSL rendered by a JavaScript runtime bundle.

## Operating principles

- Non-technical UX is the primary decision driver.
- Creator canvas and generated runtime must stay on the same rendering path.
- Preview is runtime mode, not a separate renderer.
- Progressive disclosure by default:
  - simple controls first
  - advanced mode optional
- Avoid fixed layout dimensions unless explicitly requested by the user.
- Hide developer noise in end-user mode (ids, traces, raw schema).
- Keep shadcn as current default component system.
- Add external UI libraries only through adapter contracts after parity goals are stable.

## Architecture boundaries

- `runtime-core` remains framework-agnostic.
- `runtime-react` is a thin adapter only.
- Expressions and logic execution must avoid `eval`.
- DSL must remain versioned and migration-aware.

## Documentation workflow (mandatory)

After each phase or sub-milestone:

1. Update `PLAN.md` phase status and architecture changes.
2. Update `TODO.md` completed and discovered items.
3. Update `cursor.md` with durable learnings.
4. Summarize stale context in `core.md` to keep it strategic.
5. If diagnostics/MCP changed, update `docs/mcp/debug-mcp-spec.md`.

## Current focus

- **Forward roadmap** (see [`PLAN.md`](PLAN.md)): **single-page**, **full-window React Flow as the page canvas**, **drag-and-drop-first** composition, **strict preview parity**, **lean inspector** with **drop-time defaults** from the registry. Prior work (multi-screen graph, bindings, runtime packages) remains the technical baseline; UX is being re-centered on the one-page dashboard story.
- Keep parity-first and non-technical UX-first acceptance criteria for new work.

## Learnings

- **2026-04-01 - Multi-screen clarity:** Even when `screenCount > 1`, keep the **screen graph** behind an explicit toggle and default to the page canvas; this preserves the single-page mental model while still exposing graph wiring as a secondary tool.
- **2026-04-01 - Preview parity CI guard:** Keep automated parity checks on the shared `buildViewportParityReport` path (used by builder diagnostics and `/preview`), and snapshot stable row fields (`viewportId`, `width`, `nodeCount`, `invalidRectCount`, `deterministic`) to avoid brittle pixel-level tests.
- **2026-04-01 - Phase 7 hardening:** Keep **document performance** copy out of `document-performance.ts` — return **`perfSummary`** + **`guardrailIds`** and map to **`msg()`** in **`document-performance-ui.ts`** so diagnostics and the large-doc banner stay i18n-ready without pulling i18n into pure metrics code.
- **2026-04-01 - Actions UX (Phase 6):** Keep **registry `interactionPresets`** as the template source; gate **React Flow** previews (**JSON flow** under Actions, **Logic map** in Diagnostics) behind **`?dev=1`** so default users see steps + ordering without graph chrome.
- **2026-04-01 - Bindings panel:** Validate **`BindingDescriptor`** with **`safeParseBindingDescriptor`** before persisting; keep draft editors in a **keyed** sub-tree so form state syncs from the document without effects that trip `react-hooks/set-state-in-effect`.
- **2026-04-01 - Data & state UX:** One **Sheet** from the navbar holds **initial state**, **sample data source ids** (for binding preview), and a **fetch→table state starter**; avoid a second copy under dev-only stacks so the story stays single-path.
- **2026-04-01 - Drop defaults:** Registry **`defaultLayout`** (`UiLayout`) merges in **`createNodeFromType`** alongside **`defaultProps`**; keep palette components’ spacing/padding in the registry, not ad hoc in the app.
- **2026-04-01 - Preview parity:** Extract **`RuntimePreviewHost`** (shared with `/preview`) for the builder canvas; pass **`runtimeDocumentForActiveEditorScreen(doc, activeScreenId)`** into runtime so the edited screen renders while `update()` resets to `initialScreenId` — without mutating the stored document.
- **2026-04-01 - Phase 1 builder layout:** With **one screen**, **hide** the **screen graph** so the **page canvas** fills the workspace; surface **add screen** via template dropdown + hint. With **multiple screens**, default split **22% / 78%** (graph / canvas). Palette → canvas stays primary for components; dropping on the graph to spawn a screen only applies when the graph is mounted.
- **2026-04-01 - Dashboard revamp direction:** The product narrative shifts to **one page = full React Flow workspace** + **DnD structure**, with **preview identical** to the canvas runtime path. **Multi-screen** and **screen graph** are **deferred** to a later optional phase so the default experience stays simple; document this in `PLAN.md`/`TODO.md` to avoid mixed messaging.
- **2026-03-31 - shadcn-only palette:** The builder palette uses `listShadcnPaletteDefinitions()` (Button, Input, Card, Table, Badge). **Box** and **Stack** stay in the registry for templates, screen builders, and navbar quick-adds, but are not listed as palette drags so the sidebar reads as shadcn/ui primitives only.
- **2026-03-31 - Flow-first builder + Sheet inspector:** Use exclusive selection between **prototype edges** and **canvas nodes** (`selectedEdgeId` vs `selection-store`); closing the Sheet clears via one helper (`clearSelectionEx`). **`react-resizable-panels` v4** uses **`orientation`** on `Group`, not `direction`. Edge trigger changes use **`reassignPrototypeEdgeTrigger`** to strip the old navigate/modal action from the previous trigger before **`applyPrototypeEdgeToDocument`** on the new trigger.
- **2026-03-31 - shadcn MCP + pnpm workspaces:** `shadcn mcp init` runs `pnpm add -D shadcn@latest` at the repo root without `-w`, which pnpm blocks by default; set `ignore-workspace-root-check=true` in root `.npmrc` (or pass `-w` manually only works for your own installs, not the CLI’s internal step).
- **2026-03-31 - Screen templates:** Keep composed multi-layer roots next to `createNodeFromType` in the app (`screen-template-builders.ts`) while `SCREEN_TEMPLATE_LABELS` stays in `@aiui/registry` for a single list of ids + human labels shared by the store title and the builder select.
- **2026-03-31 - navigateScreen in visual events:** Treat `navigateScreen` as a first-class branch action (with `isBranchAction` + `defaultBranchAction`) and pass `screenOptions` from the document store into `EventBindingsPanel` so the step picker stays aligned with `document.screens` without JSON edits.
- **2026-03-31 - Multi-screen documents:** Prefer `screens` + `initialScreenId` + `flowLayout` as the source of truth; use `editorDocumentView(doc, activeScreenId)` wherever the builder still expects a single `root`; legacy `root`-only JSON is normalized in `migrateDocument` via `normalizeLegacyRootToScreens`.
- **2026-03-31 - Screen graph + dnd-kit:** Bridge palette drops to React Flow coordinates with a ref to `screenToFlowPosition` and a document-level `pointermove` listener while dragging so drop placement is stable.
- **2026-03-31 - Minimal builder shell:** Navbar is Preview + undo/redo + overflow actions; **component palette** lives in a **left sidebar**; **properties and edge wiring** open in a **Sheet**; the read-only **logic map** (`LogicFlowPanel`) sits under **Diagnostics** when `/?dev=1`; export panel, live JSON, and deep diagnostics stay behind `/?dev=1`; default `/preview` carries golden JSON import/export.
- **2026-03-31 - Registry drop-ins:** `defaultChildren` provides composed starter trees (fresh ids via `cloneUiSubtreeWithNewIds`); `interactionPresets` lists beginner-friendly `Action[]` starters resolved in the app (`interaction-preset-actions.ts`).
- **2026-03-31 - Runtime primitive content:** Decorative labels and table markup use `data-aiui-content`; positioned `data-aiui-id` nodes remain the layout engine’s responsibility.
- **2026-03-31 - i18n readiness pattern:** Keep user-facing copy behind stable message keys and a tiny interpolation helper early, even for single-locale apps, so localization can be introduced incrementally without touching feature logic.
- **2026-03-31 - Canonical planning reset:** When roadmap intent changes, prefer replacing fragmented historical details with one phase-gated source of truth in `PLAN.md` plus executable checkpoints in `TODO.md`.
- **2026-03-31 - UX guardrail:** Non-technical users need template-driven action language and minimal cognitive load; advanced graph/JSON controls must remain opt-in.
- **2026-03-31 - Builder maintainability:** Extracting keyboard orchestration (`use-builder-shortcuts`) and recursive tree rendering (`node-tree`) from `builder-demo` reduces blast radius and makes feature work safer.
- **2026-03-31 - Store coupling:** Avoid direct cross-store mutation with raw `setState`; expose explicit reconciliation APIs (`reconcileSelection`) and route document mutations through a command-style commit helper.
- **2026-03-31 - Runtime lifecycle:** Resize handling should call `relayout()` instead of `update(document)` to preserve interaction state; keep state reset reserved for actual config updates.
- **2026-03-31 - Shared semantics:** Keep truthiness and unsafe path-segment checks in one package (`@aiui/expression`) and reuse from logic to prevent subtle divergence.
- **2026-03-31 - Registry UX contract:** Keep builder-facing palette/inspector/capability metadata under one `ComponentDefinition.ux` object so new components inherit discoverable UX behavior without extra app-level wiring.
- **2026-03-31 - Drag/drop language consistency:** Keep add/nest/reorder terminology in one shared copy module so palette hints, canvas affordances, and drag overlays never drift.
- **2026-03-31 - Beginner-first inspector:** Render inspector UI by ordered sections from registry metadata and map layout-scoped controls into `Layout` so first-time users see clear mental buckets before advanced controls.
- **2026-03-31 - Smart starter templates:** Template packs should be composable subtrees (filter/cards/table/chart) with explicit labels and practical default sizing so first-time users start from meaningful dashboard structure, not blank boxes.
- **2026-03-31 - Walkthrough instrumentation:** Bake first-time validation into the product surface (checklist + friction notes) so usability gaps are captured during real flows instead of after-the-fact recollection.
- **2026-03-31 - Responsive layout contract:** Keep layout extensibility explicit in DSL (`UiLayout` + responsive overrides) and enforce row wrapping semantics in layout-engine tests so schema evolution and renderer behavior stay aligned.
- **2026-03-31 - Responsive editing guardrail:** In layout editing UX, treat fixed width/height as an exception path and surface inline caution copy whenever hardcoded dimensions are present.
- **2026-03-31 - Viewport simulation:** Keep preview viewport presets centralized and explicit (desktop/tablet/mobile) so responsive checks use consistent widths across features and tests.
- **2026-03-31 - Constraint diagnostics:** Responsive readiness needs proactive warnings, not post-hoc debugging; compute layout conflicts (min/max and nowrap overflow) and surface them in builder diagnostics with suggested fixes.
- **2026-03-31 - Parity visibility:** Treat viewport parity as a first-class diagnostic with explicit per-preset status so editor/runtime consistency is continuously visible during development.
- **2026-03-31 - Binding contract clarity:** Use a discriminated binding descriptor (`kind`) as the single schema entry point for all binding modes so editors and runtime can add features without ad-hoc field guessing.
- **2026-03-31 - Non-technical binding UX:** Data binding flows should start with guided source/path selection and presets before exposing raw expressions, so first-time users can bind values without schema-level knowledge.
- **2026-03-31 - Binding confidence loop:** Always pair binding authoring controls with immediate sample-data preview so users can verify intent before applying and reduce trial-and-error edits.
- **2026-03-31 - Registry-driven editor scaling:** Keep field rendering in reusable primitives (`text/select/number/layout`) and let inspector sections orchestrate composition, so new components can be added via registry metadata without duplicating UI logic.
- **2026-03-31 - Binding error UX:** Validation should live next to binding authoring and display user-facing fixes (missing source/path, unresolved sample tokens) so broken bindings are corrected before runtime.
- **2026-03-31 - Action-list workflow ergonomics:** In non-technical event editors, step order must be directly manipulable (move up/down) in visual mode; forcing JSON edits for ordering breaks beginner flow.
- **2026-03-31 - Advanced flow usability:** Branching logic is easier to validate when advanced JSON editing and React Flow visualization are co-located and auto-synced, instead of split across distant panels.
- **2026-03-31 - Action block extensibility:** Keep new workflow blocks (`fetch`, `transform`, `modal`, `notify`) modeled in the shared DSL and logic runtime first, then mirror them in visual editor controls to preserve parity.
- **2026-03-31 - Workflow template adoption:** Non-technical action builders need one-click scenario starters (with editable generated steps) to reduce setup friction for common patterns like data-table fetch and hydrate.
- **2026-03-31 - Multi-step CRUD template:** For row-level CRUD workflows, pre-seeding modal + submit + refresh + feedback actions dramatically reduces event authoring time while keeping generated steps editable.
- **2026-03-31 - Rule-builder persistence:** Early visibility/interactivity builders should store expression rules on nodes with a stable props key so runtime/parity phases can adopt them without migration churn.
- **2026-03-31 - Palette visibility contract:** Components appear in the builder **left palette** only when they are registered in `@aiui/registry` with `ux.palette` metadata; shadcn adoption should be driven by registry entries, not app-level hardcoded lists.
- **2026-03-31 - Parity guardrail in CI:** Encode parity rules as matrix tests (viewport x initial data x repeated interaction) so deterministic runtime behavior is enforced automatically rather than validated manually.
- **2026-03-31 - Visual baseline discipline:** Keep high-priority runtime visuals under committed snapshot tests (desktop + mobile widths) so style/layout drift is detected immediately during test runs.
- **2026-03-31 - Runtime surface parity:** Route builder canvas and preview through one shared app-level runtime surface wrapper so future host-level behavior changes cannot drift between editor and preview experiences.
- **2026-03-31 - Preview chrome policy:** Default `/preview` to a chrome-hidden runtime surface and gate diagnostics/viewport controls behind explicit developer mode (`?dev=1`) so end-user behavior checks stay clean without losing debugging access.
- **2026-03-31 - Developer parity visibility:** Surface viewport parity failures in developer mode next to preview runtime output (summary + per-preset status + remediation hint) so parity regressions are diagnosable before CI failures.
- **2026-03-31 - Adapter boundary:** Treat UI-library integration as an explicit adapter contract (`UiAdapterDefinition`) with typed component lookup/listing; this keeps future library adoption out of app-level conditional logic.
- **2026-03-31 - Capability contract enforcement:** Keep component capability metadata on a shared schema + validator boundary so adapter onboarding fails fast on bad flags/modes instead of leaking inconsistent behavior into builder/runtime UX.
- **2026-03-31 - Certification before exposure:** New adapter components should clear one explicit certification checklist (contract + parity + UX + checks) before palette exposure to prevent partially-integrated components from reaching non-technical users.
- **2026-03-31 - Onboarding consistency:** Keep one adapter onboarding guide that links contract, validation, parity diagnostics, and certification steps so future UI-library integrations follow the same release discipline.
- **2026-03-31 - Telemetry signal quality:** Emit diagnostics from builder and runtime through one envelope with fingerprint-based deduplication and lightweight redaction; this keeps issue streams actionable for MCP workflows without leaking obvious sensitive fields.
- **2026-03-31 - Developer diagnostics ergonomics:** Keep diagnostics drilldown compact and list-first; a selectable recent-trace rail plus inline metadata/details JSON gives developers enough context to triage quickly without overwhelming end-user-facing surfaces.
- **2026-03-31 - MCP diagnostics layering:** Keep MCP endpoints in a dedicated package (`@aiui/debug-mcp`) with strict input/output schemas and repository abstraction, while telemetry producers only call a narrow ingest hook (`ingestTelemetryIssue`) to avoid coupling UI stores to tool logic.
- **2026-03-31 - Onboarding UX progression:** First-time guidance works best when it mixes immediate call-to-actions with empty/near-empty contextual hints, so users can act in one click and see coaching fade as momentum builds.
- **2026-03-31 - Large-document diagnostics guardrail:** For high-node dashboards, default expensive checks (layout/parity sweeps, full JSON dumps) to deferred/opt-in mode so editing remains responsive while still leaving deep diagnostics one click away.
- **2026-03-31 - Accessibility pass strategy:** For builder-style UIs, prioritize semantic landmarks and explicit region labels first, then layer control-level ARIA state (`aria-selected`, `aria-pressed`, polite live updates) so screen-reader clarity improves without risking interaction regressions.
