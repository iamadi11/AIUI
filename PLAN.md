# AIUI — UI Operating System + Runtime Platform

**Product vision:** A drag-and-drop UI dashboard creator (Retool × Webflow × Figma) that exports a **Universal JSON DSL** and a **JavaScript runtime bundle** — not framework-specific source code.

**End usage (target):**

```js
const runtime = await import("your-runtime-bundle");
runtime.render({ container: document.getElementById("app"), config: exportedDSL });
```

---

## Executive summary

| Topic | Decision |
|--------|----------|
| **Export model** | DSL JSON + runtime SDK (no React/Vue codegen as the primary artifact) |
| **Builder** | Next.js App Router, React, TypeScript, Tailwind, shadcn/ui |
| **Canvas / graphs** | dnd-kit (builder DnD), React Flow (logic/workflows) |
| **Layout** | Deterministic layout engine (Pretext-inspired); minimize DOM measurement |
| **Validation** | Zod for DSL and shared types |
| **Builder state** | Zustand (recommended): fewer boilerplate, domain-split stores; RTK optional if normalized entity complexity grows |
| **AI in product** | Out of scope for initial implementation; design hooks only in later phases |

---

## 1. High-level architecture

| Layer | Responsibility |
|--------|----------------|
| **Builder app** | Palette, canvas, inspector, tree, history, export UI |
| **Component registry** | Maps DSL `type` → metadata, default props, layout hints, capabilities |
| **UI tree model** | Canonical document: nodes, ids, parent/child, component refs |
| **Layout engine** | Deterministic box model → frames (x, y, w, h); measure rarely |
| **Logic DSL** | Events → actions; conditions; expressions over state |
| **State model** | Declared in DSL; runtime instance with schema |
| **Graph layer (React Flow)** | Workflow / logic graphs; serialized as part of DSL |
| **Runtime engine** | Load DSL → layout → render → events → action pipeline |
| **Runtime bundle** | Packaged SDK: core + optional React adapter |
| **Export** | Serialize, validate (Zod), version field |
| **Adapters** | Vanilla `render`, React `<Runtime config={dsl} />`, future hosts |

**Data flow:** Author → in-memory document → **export** → JSON → **runtime** (parse/validate → layout → render → bind → actions → state → partial update).

---

## 2. Core data models (shared via `packages/dsl-schema` or `lib/dsl`)

Define as TypeScript types **and** Zod schemas (single source of truth):

- **UI tree:** `id`, `type`, `props`, `children[]`, optional layout/style tokens
- **Component definition (registry):** keyed by `type`; not necessarily duplicated in every export if versioned catalog exists
- **Layout metadata:** flex/grid/stack constraints, spacing — only what the layout engine implements
- **Logic:** events, actions (discriminated union), optional graph reference
- **State model:** `initial`, schema, optional persistence hints
- **Expressions:** `{{path}}` strings compiled to safe AST evaluation (no `eval`)

---

## 3. Runtime bundle

**Contains:** DSL loader/validator, layout engine, renderer (DOM or React host), state, event dispatcher, action executor, expression evaluator, optional React glue.

**Properties:** Framework-agnostic core; optional React entry; ES modules; tree-shakeable; lazy-loadable where beneficial.

**Public API:**

```ts
render({ container, config })
update(config)
destroy()
```

---

## 4. Execution flow (runtime)

1. Load and validate DSL  
2. Initialize state from `initial` + schema  
3. Instantiate component tree  
4. Layout pass (deterministic; measure only for intrinsic unknowns, e.g. text)  
5. Render  
6. Bind events → actions  
7. On action: evaluate expressions → mutate state → schedule update  
8. Dirty tracking → partial re-layout / patch  

---

## 5. Phase-by-phase implementation

### Phase 1 — Builder MVP

- **Goals:** Editing loop: palette → canvas → tree; document model that survives later phases.
- **Features:** Next.js app; palette; dnd-kit canvas; stack/grid in editor; tree panel; props panel; preview route (React preview or runtime stub).
- **Decisions:** Stable node IDs (UUID); undo/redo (commands or immer + history); **serialize DSL-shaped document from day one** so preview/runtime do not diverge.
- **Risks:** Preview ≠ runtime → **mitigation:** shared `registry` package immediately.

### Phase 2 — Layout engine

- **Goals:** Deterministic `layout(tree, constraints) → Map<id, Rect>`.
- **Features:** Stack, row/column, grid; padding/gap; batched/cached text measurement.
- **Decisions:** Pretext-style constraint passes; explicit supported subset; `layoutVersion` in DSL.
- **Location:** Pure TS package (`packages/layout-engine` or `lib/layout`), no React.

### Phase 3 — Logic system

- **Goals:** Event → action model; `{{state.path}}`; binding props to state.
- **Features:** Actions: `setState`, `navigate`, `http`, sequences, conditions; React Flow for complex graphs (can start linear, then graph).
- **Decisions:** Whitelist expression functions; AST-only evaluation.

### Phase 4 — Runtime engine

- **Goals:** Interpreter matching builder behavior; core without React dependency.
- **Features:** Full pipeline; per-node error isolation; batched updates.
- **Decisions:** Microtask batching; deterministic action order for tests.

### Phase 5 — Runtime bundle packaging

- **Goals:** Publishable package with `exports` for `core` vs `react`.
- **Features:** Vite/Rollup; source maps; size budgets in CI.
- **Decisions:** Monorepo packages; `peerDependencies` for React adapter.

### Phase 6 — Export system

- **Goals:** Validated export/import round-trip.
- **Features:** Zod for full document; `version` field; optional minification.
- **Decisions:** Semantic versioning of DSL; runtime supports N previous major versions via small adapters.

### Phase 7 — Multi-platform adapters

- **Goals:** Vanilla and React hosts as in product spec.
- **Features:** `destroy()` cleans listeners; React wrapper syncs `update` on config change.
- **Python / backends:** Store and validate JSON in FastAPI/Django; **browser runtime stays JS** unless a separate server-side executor is explicitly scoped.

### Phase 8 — Future enhancements

- AI-assisted generation (DSL output only), collaboration/CRDT, plugins, marketplace — roadmap only until prioritized.

---

## 6. Per-phase deliverables checklist

For each phase, track: **goals, features, technical decisions, folder layout, key abstractions, public/internal APIs, risks.**

Suggested monorepo:

```
apps/web/                 # Next.js builder
packages/dsl-schema/
packages/registry/
packages/layout-engine/
packages/runtime-core/
packages/runtime-react/
```

---

## 7. Layout engine deep dive

- **Computation:** Bottom-up intrinsics (text, known image dims) → top-down constraints for flex/grid.
- **Text:** Measure with font key; cache; batch reads to avoid thrashing.
- **Tradeoff vs browser:** Determinism and testability vs full CSS — acceptable with explicit DSL subset.
- **DOM measurement:** Only when intrinsic size is unknown (e.g. dynamic text); isolate in `measure` module.

---

## 8. Logic DSL

- **Action types:** `setState`, `navigate`, `http`, `sequence`, `condition`, optional `delay`; dev-only `log`.
- **Execution:** Sync default; async HTTP with loading/error state conventions.
- **Errors:** Per-action handling; `runtime.onError` callback.

---

## 9. Runtime engine

- **Rendering pipeline:** validate → instantiate → layout → render → bind.
- **State:** Predictable immutable updates internally.
- **Events:** Prefer delegation where possible to limit listeners.

---

## 10. React Flow

- **Primary:** Logic/workflow graph (triggers, branches).
- **Optional:** Relationship view for UI hierarchy — same DSL, different projection.
- **Sync:** Debounced two-way sync; validate cycles where required.

---

## 11. Export philosophy

- **DSL + runtime** avoids framework churn and keeps one interpreter to version.
- **Dynamic import** keeps host apps minimal.
- **Compatibility:** `version` + capability flags + migration helpers.

---

## 12. Implementation strategy

| Build first | Defer |
|-------------|--------|
| Document + registry + import/export | Marketplace, AI |
| Layout subset for core primitives | Full CSS |
| Linear actions + expressions | Full graph UI (or follow immediately after) |
| Runtime core + React adapter | Vanilla adapter until needed |
| Zod everywhere | Plugin sandboxing |

**Performance:** Virtualize large trees in builder; incremental layout in runtime.

---

## 13. Related project files

| File | Purpose |
|------|---------|
| `core.md` | Original product / architecture prompt |
| `cursor.md` | Cursor/agent conventions and pointers (update as the project learns) |
| `TODO.md` | Actionable backlog; agents update as work completes |
| `.cursor/skills/` | Project skills for DSL/runtime and repo upkeep |

This document should evolve when major architectural decisions change; note changes in `cursor.md` or git history.

---

## 14. Builder product UX phases (visual programming)

These phases improve **how** users edit the DSL in the Next.js builder. They sit alongside the engine milestones above; **status** lives in `TODO.md`.

| Phase | Focus |
|-------|--------|
| **1 — Foundation** | Canvas interaction, selection/hover, inline labels, clear affordances, low-friction basics |
| **2 — Components** | Palette layout, categories, search, registry-driven extensibility *(baseline: registry metadata + grouped searchable palette)* |
| **3 — Layout** | Drag/resize, spacing controls, snapping, constraints *(baseline: layout padding + leaf W/H, sibling reorder on canvas)* |
| **4 — Events** | Friendly event list/editor, discoverability *(baseline: visual steps + presets + advanced JSON)* |
| **5 — Logic** | API/state/conditions UI, progressive disclosure, hide raw JSON for typical flows *(baseline: If + HTTP body + initial `state` panel)* |
| **6 — Graph** | React Flow workflows, sync with simple mode, debug *(baseline: flattened action chain, inspect step JSON, stats; Properties remains source of truth)* |
| **7 — Convergence** | Builder uses runtime engine; preview parity *(baseline: builder canvas = `AiuiRuntime`; layout-aligned palette drops + grips; `/preview` runtime-only)* |
| **8 — Power** | Multi-select, templates, shortcuts, diagnostics *(baseline: delete/duplicate/⌘D, shortcuts help, one row template; multi-select deferred)* |

**Principles:** Visual-first, smart defaults, progressive disclosure, never expose raw DSL to end users in product flows; keep `AiuiDocument` as source of truth.
