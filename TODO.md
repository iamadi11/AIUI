# AIUI — TODO

**How to use:** Agents and humans keep this list **current**. When something is done, **remove** it or move it to a “Done” section with a date. When new work is discovered, **add** it. Prefer short, verifiable items tied to `PLAN.md` phases.

---

## Setup & foundation

- [ ] Single root `pnpm-lock.yaml` policy: do not add `pnpm-workspace.yaml` or a nested lockfile under `apps/web` (breaks `workspace:*` resolution)

---

## Phase 1 — Builder MVP

_Baseline MVP shipped — see **Done**._

---

## Phase 2 — Layout engine

_Shipped baseline — see **Done** and `packages/layout-engine/README.md`._

---

## Phase 3 — Logic system

_Logic graph shipped — see **Done**._

---

## Phase 4 — Runtime engine

_Baseline shipped — `@aiui/runtime-core` (`render` / `update` / `destroy`); see **Done**._

- [ ] Partial re-layout / DOM diff after state changes (currently full rebuild microtask after actions)

---

## Phase 5 — Runtime bundle packaging

- [ ] Vite/Rollup build with separate entries for core vs React adapter
- [ ] Public API: `render`, `update`, `destroy`
- [ ] CI bundle size budget or warning thresholds

---

## Phase 6 — Export system

- [ ] Full-document Zod validation everywhere exports/imports touch the DSL (builder golden path exists; extend to CI/runtime)
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

- **2026-03-31** — **Preview `/preview`:** `RuntimePreview` mounts `@aiui/runtime-core` (ResizeObserver → `update` on width change); React `DslPreview` kept as labeled dev host; `transpilePackages` includes runtime-core, logic, expression
- **2026-03-31** — **`@aiui/runtime-core`:** `render({ container, config })` → validate DSL, `layoutDocument`, nested absolute DOM from registry primitives, `events` → `runActions` with document `state`; `queueMicrotask` batch after actions; per-node mount error UI; Vitest + happy-dom
- **2026-03-31** — **React Flow** (`@xyflow/react`): read-only **Logic graph** panel for selected node — `events` → Start → event name → action chain; `eventsToFlowElements`; styles in `globals.css`; `nodrag nopan` + DnD context; `hideAttribution`
- **2026-03-31** — Builder **Properties** → **Events**: linear list of bindings (event name + JSON actions array), validated with `safeParseActionsArray`; blur / add / remove commits to `node.events`
- **2026-03-31** — Logic DSL + executor: `Action` union + Zod `actionSchema`; document `state` + node `events`; `@aiui/logic` — `runAction` / `runActions`, `setPathImmutable`, `setState` / `navigate` / `http` / `sequence` / `condition` (expressions via `@aiui/expression`); Vitest
- **2026-03-31** — `@aiui/expression`: lexer + AST parser + `evaluate` / `evaluateExpression`; `interpolateTemplate` for `{{ }}`; blocks unsafe path segments; Vitest coverage
- **2026-03-31** — `@aiui/layout-engine`: `layoutDocument` → `Map<id, Rect>`; Box column + Stack row/column + `gap`; `layout.padding`; `measure.ts` text cache stub; `LAYOUT_VERSION` on `AiuiDocument`; builder **Layout debug** panel
- **2026-03-31** — Golden export/import: `exportGoldenJson` / `importGoldenJson` via `safeParseDocument`; builder panel — download, copy, file import (`setDocument`, clears history); filename `aiui-document-<version>.json`
- **2026-03-31** — Preview route `/preview`: client page reads live Zustand document; `DslPreview` maps `Box` / `Stack` via `@aiui/registry`; `safeParseDocument` banner; link from builder toolbar
- **2026-03-31** — Undo/redo: full-document snapshots (`structuredClone`), stacks capped at 50; structural + prop edits; `reset` / `setDocument` clear history; selection cleared when undo removes selected node; ⌘Z / ⌘⇧Z and Ctrl+Y shortcuts (skipped in form fields)
- **2026-03-31** — Properties inspector: `InspectorField` metadata on `ComponentDefinition`; Stack direction + gap; `PropertiesInspector` column updates props via `updateNode`
- **2026-03-31** — Component palette (`@aiui/registry` primitives) + dnd-kit canvas: nested `useDroppable` targets with depth-prioritized `pointerWithin` collision; palette drag appends via `appendChildOfType`
- **2026-03-31** — Document model + Zustand: `AiuiDocument` as canonical shape; `lib/document/tree.ts` immutable helpers; `stores/document-store` + `stores/selection-store`; `BuilderDemo` on home exercises add/remove/select
- **2026-03-31** — Monorepo (`pnpm` workspaces): `apps/web`, `packages/dsl-schema`, `packages/registry`; root `tsconfig.base.json`
- **2026-03-31** — `@aiui/dsl-schema`: Zod `documentSchema` / recursive `uiNodeSchema`, `DSL_VERSION`, `parseDocument`
- **2026-03-31** — `@aiui/registry`: primitives `Box`, `Stack` metadata
- **2026-03-31** — Next.js 16 App Router + Tailwind 4 + shadcn (base-nova); `transpilePackages` for workspace libs; home page smoke test parsing sample DSL
