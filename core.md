# AIUI Core Brief

## Product intent

Build a Figma-like dashboard creator for non-technical users.
Users should drag, configure, preview, and publish without engineering help.

## Non-negotiable decisions

- Export model is JSON DSL + runtime bundle.
- Do not rely on framework-specific code generation.
- Runtime public API remains:
  - `render({ container, config })`
  - `update(config)`
  - `relayout()`
  - `destroy()`
- Creator, preview, and runtime must stay behaviorally identical.
- Keep shadcn as current component baseline.
- Future component ecosystems must use adapter contracts.

## User experience constraints

- UI must be intuitive for non-technical users.
- Keep controls clean and contextual; avoid exposing raw internals by default.
- Provide visual side-effects and visibility logic builders.
- Include guided templates for common workflows:
  - button -> fetch -> table
  - row action -> modal -> submit -> refresh

## Technical direction

- Builder: Next.js App Router + TypeScript + Tailwind + shadcn.
- Interaction model: dnd-kit for canvas movement, React Flow for advanced logic graph.
- Validation: Zod and versioned DSL schemas.
- Runtime: deterministic engine with framework-agnostic core and React adapter.
- Layout: responsive-first constraints, avoid unnecessary fixed sizing.

## Developer operability

- Add diagnostics surface for issue tracing.
- Add Cursor-compatible MCP for issue read, context, safe fix proposal, guarded patching, and validation.
- Keep sensitive data redacted in diagnostics channels.

## Canonical planning source

Use `PLAN.md` for full phase breakdown and acceptance gates.
Use `TODO.md` for executable tasks.
Use `cursor.md` for durable conventions and learnings.
