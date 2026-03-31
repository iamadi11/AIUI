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

- Execute Phase 1 to Phase 8 from `PLAN.md` in order.
- Maintain parity-first and non-technical UX-first acceptance criteria.

## Learnings

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
