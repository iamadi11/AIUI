---
name: aiui-platform
description: >-
  Guides architecture and implementation for the AIUI UI runtime platform:
  Universal JSON DSL, deterministic layout engine, logic/actions/expressions,
  React Flow page canvas, Next.js builder, shadcn/ui, Zod, and runtime bundle
  packaging. Use when editing the builder, DSL schema, registry, layout-engine,
  runtime-core, runtime-react, export pipeline, or when the user mentions
  phases, Pretext-style layout, preview parity, or framework-agnostic runtime.
---

# AIUI Platform

## Product shape

- **Builder** produces **JSON DSL** + users ship a **JS runtime bundle** that calls `render({ container, config })`.
- **Do not** treat framework codegen as the primary artifact.
- **Canvas and preview** must use the **same runtime path** (parity).

## Stack

- Next.js App Router, React, TypeScript, Tailwind, shadcn/ui  
- dnd-kit (palette/canvas), **React Flow as the full-window page canvas** (structure); optional React Flow for advanced logic under dev mode  
- Zod for DSL validation; shared types in `dsl-schema`  
- Builder state: **Zustand** by default (split stores by domain: document, selection, history).

## Boundaries

| Area | Rule |
|------|------|
| `runtime-core` | No React dependency |
| `runtime-react` | Thin adapter; `peerDependencies.react` |
| Expressions | AST/safe evaluator only — **never** `eval` |
| Layout | Deterministic TS layout; measure text in isolated, cached passes |

## Phases (forward roadmap — see `PLAN.md`)

1. **Phase 0** — Docs alignment; scope freeze (single-page primary)  
2. **Phase 1** — Full-window React Flow page canvas; DnD structure  
3. **Phase 2** — Preview parity hard gate (same runtime as canvas)  
4. **Phase 3** — Drop-time defaults; lean inspector  
5. **Phase 4** — State and data authoring UX  
6. **Phase 5** — Unified bindings  
7. **Phase 6** — Actions, CTAs, side effects  
8. **Phase 7** — Hardening (diagnostics, MCP, i18n, a11y, perf)  
9. **Phase 8+** — Optional multi-screen / navigation layer  

**Legacy:** Registry, layout engine, earlier parity/adapter/MCP phases shipped before this re-center; they underpin packages but do not replace the UX gates above.

## Key files

- `PLAN.md` — full system design and phased gates  
- `TODO.md` — backlog  
- `cursor.md` — evolving conventions  

## When changing DSL

- Bump or document `version` / `layoutVersion`.  
- Update Zod schemas and add round-trip tests if export/import exists.
