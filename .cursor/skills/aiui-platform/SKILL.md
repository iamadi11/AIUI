---
name: aiui-platform
description: >-
  Guides architecture and implementation for the AIUI UI runtime platform:
  Universal JSON DSL, deterministic layout engine, logic/actions/expressions,
  React Flow workflows, Next.js builder, shadcn/ui, Zod, and runtime bundle
  packaging. Use when editing the builder, DSL schema, registry, layout-engine,
  runtime-core, runtime-react, export pipeline, or when the user mentions
  phases, Pretext-style layout, or framework-agnostic runtime.
---

# AIUI Platform

## Product shape

- **Builder** produces **JSON DSL** + users ship a **JS runtime bundle** that calls `render({ container, config })`.
- **Do not** treat framework codegen as the primary artifact.

## Stack

- Next.js App Router, React, TypeScript, Tailwind, shadcn/ui  
- dnd-kit (canvas), React Flow (logic graphs)  
- Zod for DSL validation; shared types in `dsl-schema`  
- Builder state: **Zustand** by default (split stores by domain: document, selection, history).

## Boundaries

| Area | Rule |
|------|------|
| `runtime-core` | No React dependency |
| `runtime-react` | Thin adapter; `peerDependencies.react` |
| Expressions | AST/safe evaluator only — **never** `eval` |
| Layout | Deterministic TS layout; measure text in isolated, cached passes |

## Phases (order)

1. Builder MVP + document + registry + export-shaped JSON  
2. Layout engine (pure TS)  
3. Logic + expressions + React Flow sync  
4. Runtime interpreter  
5. Bundle packaging  
6. Export validation + versioning  
7. Adapters (vanilla + React)  
8. Future: AI, collaboration, plugins — not default scope  

## Key files

- `PLAN.md` — full system design  
- `TODO.md` — backlog; update when tasks complete  
- `cursor.md` — evolving conventions  

## When changing DSL

- Bump or document `version` / `layoutVersion`.  
- Update Zod schemas and add round-trip tests if export/import exists.
