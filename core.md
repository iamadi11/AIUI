# AIUI Core Brief

## Product intent

Build a **dashboard creator** where **one page** is composed **on a full-window React Flow canvas** via **drag-and-drop**, then configured (state, data, bindings, actions) without engineering help. **Preview must match** what the canvas runtime shows for the same document.

## Non-negotiable decisions

- Export model is JSON DSL + runtime bundle.
- Do not rely on framework-specific code generation.
- Runtime public API remains:
  - `render({ container, config })`
  - `update(config)`
  - `relayout()`
  - `destroy()`
- **Creator canvas and preview** must stay on the **same rendering path** (parity).
- Keep shadcn as current component baseline.
- Future component ecosystems must use adapter contracts.

## User experience constraints

- **Primary surface:** **Palette + full-area React Flow page graph**; configuration in contextual overlays (e.g. Sheet), not permanent third rails.
- **Drop-time defaults:** Registry supplies sensible initial props/layout when a component lands on the canvas.
- **Fewer fields:** Avoid redundant inspector controls; progressive disclosure for advanced and JSON.
- **Developer-aligned workflow:** layout → state/data → bind to UI → side effects and CTAs.
- Include guided templates for common workflows (e.g. fetch → table; row action → modal → refresh).

## Technical direction

- Builder: Next.js App Router + TypeScript + Tailwind + shadcn.
- **Interaction model:** React Flow as the **page graph**; dnd-kit for palette-to-graph drops; optional React Flow for **screen map** and **advanced** logic visualization behind dev mode.
- Validation: Zod and versioned DSL schemas.
- Runtime: deterministic engine with framework-agnostic core and React adapter.
- Layout: responsive-first constraints; avoid unnecessary fixed sizing.

## Developer operability

- Add diagnostics surface for issue tracing.
- Add Cursor-compatible MCP for issue read, context, safe fix proposal, guarded patching, and validation.
- Keep sensitive data redacted in diagnostics channels.

## Canonical planning source

Use [`PLAN.md`](PLAN.md) for the **phased roadmap** and acceptance gates.
Use [`TODO.md`](TODO.md) for executable tasks.
Use [`cursor.md`](cursor.md) for durable conventions and learnings.
