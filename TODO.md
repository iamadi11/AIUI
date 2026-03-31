# AIUI — TODO

**How to use:** Agents and humans keep this list **current**. When something is done, **remove** it or move it to a “Done” section with a date. When new work is discovered, **add** it. Prefer short, verifiable items tied to `PLAN.md` phases.

---

## Setup & foundation

- [ ] Single root `pnpm-lock.yaml` policy: do not add `pnpm-workspace.yaml` or a nested lockfile under `apps/web` (breaks `workspace:*` resolution)

---

## Phase 1 — Builder MVP

- [ ] Preview route using shared registry (React preview or runtime stub)
- [ ] Golden export: serialize document to JSON matching schema

---

## Phase 2 — Layout engine

- [ ] Extract pure TS layout package: constraints → `Map<nodeId, Rect>`
- [ ] Implement stack / row / column + padding / gap
- [ ] Text measurement strategy with caching (minimize DOM reads)
- [ ] Document `layoutVersion` and supported subset in schema

---

## Phase 3 — Logic system

- [ ] Expression parser/evaluator (safe; no `eval`)
- [ ] Event bindings and action types: `setState`, `navigate`, `http`
- [ ] Wire builder inspector for events/actions (linear list first)
- [ ] Integrate React Flow for logic graph (optional in same phase after linear path works)

---

## Phase 4 — Runtime engine

- [ ] `runtime-core`: load DSL, layout, render to DOM, bind events, run actions
- [ ] State store + reactive updates with deterministic ordering
- [ ] Error boundaries / per-node failure isolation

---

## Phase 5 — Runtime bundle packaging

- [ ] Vite/Rollup build with separate entries for core vs React adapter
- [ ] Public API: `render`, `update`, `destroy`
- [ ] CI bundle size budget or warning thresholds

---

## Phase 6 — Export system

- [ ] Full-document Zod validation on export and import
- [ ] Version field + migration stub for older JSON
- [ ] Round-trip tests: builder export → runtime import

---

## Phase 7 — Adapters

- [ ] React adapter component + `useEffect` / `useLayoutEffect` sync for `config` updates
- [ ] Vanilla JS example in `examples/` or README snippet

---

## Phase 8 — Future (do not start until prioritized)

- [ ] AI-assisted UI → DSL (design only until scheduled)
- [ ] Collaboration / CRDT
- [ ] Plugin / marketplace architecture

---

## Done

- **2026-03-31** — Undo/redo: full-document snapshots (`structuredClone`), stacks capped at 50; structural + prop edits; `reset` / `setDocument` clear history; selection cleared when undo removes selected node; ⌘Z / ⌘⇧Z and Ctrl+Y shortcuts (skipped in form fields)
- **2026-03-31** — Properties inspector: `InspectorField` metadata on `ComponentDefinition`; Stack direction + gap; `PropertiesInspector` column updates props via `updateNode`
- **2026-03-31** — Component palette (`@aiui/registry` primitives) + dnd-kit canvas: nested `useDroppable` targets with depth-prioritized `pointerWithin` collision; palette drag appends via `appendChildOfType`
- **2026-03-31** — Document model + Zustand: `AiuiDocument` as canonical shape; `lib/document/tree.ts` immutable helpers; `stores/document-store` + `stores/selection-store`; `BuilderDemo` on home exercises add/remove/select
- **2026-03-31** — Monorepo (`pnpm` workspaces): `apps/web`, `packages/dsl-schema`, `packages/registry`; root `tsconfig.base.json`
- **2026-03-31** — `@aiui/dsl-schema`: Zod `documentSchema` / recursive `uiNodeSchema`, `DSL_VERSION`, `parseDocument`
- **2026-03-31** — `@aiui/registry`: primitives `Box`, `Stack` metadata
- **2026-03-31** — Next.js 16 App Router + Tailwind 4 + shadcn (base-nova); `transpilePackages` for workspace libs; home page smoke test parsing sample DSL
