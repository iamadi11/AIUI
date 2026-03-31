# Cursor / agent guide — AIUI

This file is the **project handbook for AI assistants and humans** using Cursor. **Update it** when conventions change, major decisions land, or recurring pitfalls appear.

## What this repo is building

A **UI runtime platform**: visual builder → **Universal JSON DSL** + **JavaScript runtime bundle** (not primary codegen to React/Vue). See `PLAN.md` for architecture and phases; `core.md` for the original product brief.

## Stack (target)

- **Builder:** Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui  
- **DnD / graphs:** dnd-kit, React Flow  
- **Validation / types:** Zod, shared `dsl-schema`  
- **Builder state:** Zustand (default choice unless complexity justifies RTK)

## Git (monorepo)

Use **one repository at the repo root**. Do not keep `apps/<name>/.git` (nested repos break `workspace:*` and confuse Source Control). If a tool creates a nested repo, remove that `.git` directory and commit the app files into the root repo.

## pnpm (monorepo)

Use **one** `pnpm-lock.yaml` and **one** `pnpm-workspace.yaml` at the repo root only. Nested lockfiles or workspace files under `apps/` break `workspace:*` resolution. `pnpm test` runs `pnpm run check:repo` (`scripts/check-single-repo-lockfile.mjs`).

## Repository pointers

| Path | Purpose |
|------|---------|
| `PLAN.md` | System design and phased plan |
| `TODO.md` | Current backlog — **agents must keep this current** |
| `core.md` | Source requirements / constraints |
| `.cursor/skills/` | Project-specific skills (read when relevant) |
| `.cursor/rules/` | Cursor rules (e.g. TODO maintenance) |

## Agent workflow (expected)

1. **Before sizeable work:** Read `TODO.md` and `PLAN.md` (relevant phase only if large).  
2. **During work:** Follow patterns in existing code; prefer shared DSL types over ad-hoc shapes.  
3. **After completing a task:** Update `TODO.md` — remove completed items, add newly discovered work, adjust priorities if needed.  
4. **When learnings are durable:** Add a short note here under [Learnings](#learnings) or tighten `.cursor/skills/` so future sessions inherit them.

## Principles

- **Runtime core stays framework-agnostic**; React is an adapter.  
- **No `eval`** for expressions; AST or safe evaluator only.  
- **DSL is versioned**; breaking changes require version bumps and migration notes in `PLAN.md` or a `CHANGELOG.md` once the project exists.  
- **Do not implement AI product flows** until explicitly scheduled (Phase 8 / future).  
- **Minimal diffs:** Change only what the task requires; avoid drive-by refactors.

## Skills to use

- **`aiui-platform`** — architecture, DSL/runtime boundaries, stack, phase order.  
- **`aiui-repo-upkeep`** — when to edit `TODO.md`, `cursor.md`, and `PLAN.md`.

## Learnings

_Add dated or milestone notes below as the project progresses._

- **2026-03-31 — Builder UX Phase 1:** Use optional `props.label` on primitives for user-facing layer names; extend `@aiui/registry` `InspectorField` with `kind: "text"` instead of one-off inspector switches. Inline edit on canvas should cancel on **Escape** without committing — guard `blur` with a ref so cancel does not save partial text.
- **2026-03-31 — Builder UX Phase 2:** Drive the palette from registry metadata (`paletteCategory`, keywords, description) and keep search/filter in `matchesPaletteSearch` so new primitives do not require palette refactors beyond registering them.
- **2026-03-31 — Builder UX Phase 3:** Use `DndContext` collision switching — `canvasPointerCollision` for palette drops (deepest droppable), `closestCenter` for `@dnd-kit/sortable` sibling reorder — so both interaction modes stay predictable. Persist layout edits on `node.layout` via inspector `scope: "layout"` rather than ad-hoc keys in `props`.
- **2026-03-31 — Builder UX Phase 4:** Keep `node.events` as the source of truth; drive the panel from parsed `Action[]` and only use JSON mode when actions are not a flat list of `setState` | `navigate` | `http`. Commit visual edits on **blur** (not every keystroke) so undo history stays usable.
- **2026-03-31 — Builder UX Phase 5:** Treat `document.state` like any other document field: undoable `setDocumentState` beside tree edits. Extend `isSimpleAction` to allow one-level `condition` whose `then`/`else` are branch-only — nested `sequence` / multi-level conditions still require Advanced JSON until the graph/sync phase.
- **2026-03-31 — Builder UX Phase 6:** Keep the React Flow graph **derived** from parsed `Action[]`: flatten `sequence`/`condition` for layout and carry the original `Action` on node `data` for inspect-only debugging; avoid a second editable surface until true two-way sync is specified.
- **2026-03-31 — Builder UX Phase 8:** Centralize subtree duplication as `cloneUiSubtreeWithNewIds` (new ids at every node); call `sanitizeSelection` after `removeNode` so the selection store cannot reference a deleted id. Keep keyboard handlers scoped to “not typing in inputs” to avoid fighting form fields. Drive starter layouts via `BUILDER_DOCUMENT_TEMPLATES` and render template buttons from that array so adding new templates stays a metadata-only change. Model selection as **primary id + array of selected ids**; support multi-select via Cmd/Ctrl-click in the canvas and tree, and apply delete/duplicate actions to all selected ids except the root.
- **2026-03-31 — Builder diagnostics panel:** Keep diagnostics as a separate builder card (`DiagnosticsPanel`) that derives from the current document and stores: schema validity (`safeParseDocument`), selection size, node/leaf/event/action counts, and undo/redo depths. This gives quick runtime/editor health signals without requiring raw JSON inspection.
- **2026-03-31 — Panel sync effects:** For editor panels that rebuild local rows from props/state, keep `useEffect` dependencies on the actual source values (`document.state`, `events`) rather than only derived fingerprints so undo/import flows remain deterministic and hook lint stays green.
- **2026-03-31 — Layout margin + canvas resize:** Treat `layout.margin` as outside the border box in `measureNode` / `layoutSubtree`; pass `innerW - margin.left - margin.right` into child measurement. For resize, sync `onLeafLayoutResize` via a ref updated in `useLayoutEffect` so pointer listeners do not close over a stale callback mid-drag; avoid assigning refs during render (React Compiler / eslint). While resizing, render lightweight alignment guides when the resized leaf edge is within a small threshold of sibling edges.
- **2026-03-31 — Builder marginSides:** Add `InspectorField` `kind: "marginSides"` in `@aiui/registry`; Properties reads uniform `margin` numbers as equal sides and writes `{ top, right, bottom, left }`; clearing all sides removes `layout.margin`.
- **2026-03-31 — Layout constraint UI (debug):** `LayoutDebugPanel` drives `layoutDocument` with an adjustable width constraint (slider + numeric input and reset) so you can see rects react to different container widths without affecting the main builder canvas.

- **2026-03-31 — pnpm + Next in monorepo:** `create-next-app` can leave `apps/web/pnpm-lock.yaml` and a stray `apps/web/pnpm-workspace.yaml` (build-ignore only). Either breaks `workspace:*` resolution and `pnpm add` from `apps/web`. Use a single lockfile at the repo root and delete the nested `pnpm-workspace.yaml` under `apps/web` unless it intentionally defines workspace `packages`.
- **2026-03-31 — Recursive Zod tree:** Annotate `uiNodeSchema` as `z.ZodType<UiNode>` with a hand-written `UiNode` type; avoid `.default({})` on `props` if you need the schema to satisfy `ZodType<UiNode>` under strict builds.
- **2026-03-31 — Builder document state:** Keep the editor’s source of truth as `AiuiDocument` (`dsl-schema`); perform structural edits via pure tree helpers (`updateNodeById`, `insertChild`, `removeNodeById`) so later undo/export paths stay aligned with Zod validation.
- **2026-03-31 — dnd-kit nested canvas drops:** When each tree node is a droppable, rects overlap; combine `pointerWithin` with picking the droppable whose `data` carries the greatest tree `depth` so the innermost target wins.
- **2026-03-31 — Next.js + Zustand default document:** Do not put `crypto.randomUUID()` (or `newNodeId()`) in module-scope initial state for client components that SSR; server and client bundles each evaluate it once and produce different node ids. Use a fixed `INITIAL_DOCUMENT_ROOT_ID` for `createInitialDocument`, keep random ids for nodes created after load.
- **2026-03-31 — Builder inspector vs registry:** Describe editable props in `@aiui/registry` (`inspectorFields` + `InspectorField` union) so the panel stays aligned with defaults and new primitives without ad-hoc switch statements in the app.
- **2026-03-31 — Builder undo/redo:** Snapshot `AiuiDocument` with `structuredClone` before each mutation; keep `past`/`future` stacks with a max depth; after undo/redo validate selection still exists in the tree.
- **2026-03-31 — Builder preview:** The builder **canvas** mounts `AiuiRuntime` (same DOM as `/preview`). Use `layoutDocument` at the measured canvas width for palette drop overlays and sortable grips so DnD lines up with runtime rects; selection delegates to `[data-aiui-id]`; ignore `pointerdown` on builder chrome (`data-aiui-builder-chrome`) and grips (`data-aiui-grip`) so overlays do not clear selection.
- **2026-03-31 — runtime-core DOM:** Lay out with `layoutDocument`, then mount a nested `position:absolute` tree (child `left/top` subtract the parent `Rect`); after `runActions`, schedule a single `queueMicrotask` rebuild; wrap per-node mount in try/catch and render a small error strip instead of failing the whole tree.
- **2026-03-31 — Next.js preview + runtime-core:** In `RuntimePreview`, `ResizeObserver` on the host calls `rt.update(latestDocument)` so `layoutDocument` sees the new `clientWidth` without waiting for a Zustand edit; keep `transpilePackages` listing every workspace package the app imports transitively (`runtime-core` → `logic` → `expression`).
- **2026-03-31 — Vite runtime bundles:** Use a dedicated `vite.lib.config.ts` (not the default `vite.config.ts`) so Vitest in `runtime-core` does not inherit library-mode settings. Prefer `vite-plugin-dts` with `rollupTypes: false` unless API Extractor rollups are wired; ESM output `fileName: () => "index.mjs"` for predictable `bundle:check` scripts.
- **2026-03-31 — DSL migration:** Keep `migrateDocument` separate from `document.ts` (`versions` → `migrate` → `document`) so `golden-json` can import parse helpers without circular deps; optional `layoutVersion` means “missing layout” is not a parse failure—test migrations that truly invalidate schema (e.g. absent `version`).
- **2026-03-31 — DSL migration chain:** `MIGRATION_REGISTRY` keys are **source** `version` strings; each `MigrationFn` advances one hop (set `version` to the next format). `migrateDocument` runs `applyVersionMigrations` after filling empty `version` / default `layoutVersion`. On each incompatible bump, add a new key for the previous `DSL_VERSION` and bump `DSL_VERSION` in `versions.ts`.
- **2026-03-31 — React runtime adapter:** Keep a single `RuntimeHandle` in a ref; sync DSL changes with `useLayoutEffect` (not `useEffect`) so layout runs before paint; put `ResizeObserver` in a separate `useEffect` with `[]` and read `docRef.current` on resize; tear down runtime in an unmount-only `useEffect` cleanup so document edits do not destroy the handle.
- **2026-03-31 — Runtime package exports:** Keep the main `"."` export on TypeScript source for Next + `transpilePackages`; expose a separate `./bundled` subpath to `dist/index.mjs` after `vite build` so external apps (or docs) can pin the pre-built artifact without changing the default dev path.
- **2026-03-31 — runtime-core flush:** Only re-seed `state` from `doc.state` on initial mount and `update()` (`shouldResetStateFromDoc`); action-driven `rebuild` keeps `state`. When `prevConfigRef === config` and `prevDoc` is set, skip `replaceChildren` and only run `layoutDocument` + rect patches (`patchSubtree`).
- **2026-03-31 — runtime-core structural sync:** Keep `prevDoc` after successful mount; on a new `config` reference, if the root id matches and the root element exists, reconcile with `syncNode` (layout + `events` rebinding when JSON changes) instead of `clearListenersAndDom`; store disposers per `data-aiui-id`; remove subtrees for dropped ids and `ensureAiuiChildOrder` for sibling order.
- **2026-03-31 — Golden JSON:** Always run `safeParseDocument` before writing bytes to disk or clipboard so exports cannot drift from `documentSchema`; re-validate on import before `setDocument`.
- **2026-03-31 — Layout engine package:** Keep `@aiui/layout-engine` free of React; pass intrinsic sizes via `intrinsics` map until text nodes exist; document `layoutVersion` (`LAYOUT_VERSION`) separately from DSL `version`.
- **2026-03-31 — Expressions:** Keep evaluation in `@aiui/expression` (AST + context lookup only; no `eval`); reject `__proto__` / `constructor` / `prototype` path segments; use `interpolateTemplate` for `{{ }}` in bindings and copy.
- **2026-03-31 — Logic actions:** Serialize `Action` + node `events` + optional document `state` in `dsl-schema`; run with `@aiui/logic` and an injected `ActionEnvironment` (`getState` / `setState` / `navigate` / `fetch`) so the builder and runtime share one executor shape.
- **2026-03-31 — Builder events UI:** Edit `events` as a list of rows (name + JSON array); validate with `safeParseActionsArray` from `dsl-schema`; sync local rows when `nodeId` or a serialized fingerprint of `events` changes (undo/import).
- **2026-03-31 — React Flow in builder:** Import `@xyflow/react/dist/style.css` in `globals.css`; wrap the canvas in `nodrag nopan` so `@dnd-kit` does not steal pointer events; use `defaultNodes`/`defaultEdges` + `key` on `ReactFlowProvider` to refresh when `events` changes.
