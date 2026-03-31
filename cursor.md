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
