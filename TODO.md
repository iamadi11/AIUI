# AIUI - Execution Backlog

This backlog tracks the non-technical dashboard roadmap in `PLAN.md`.

## Active roadmap tasks

### Phase 0 - Documentation reset

- [x] Rebuild `PLAN.md` into canonical non-technical product roadmap.
- [x] Rewrite `TODO.md` into phase-gated actionable checklist.
- [x] Update `cursor.md` principles for parity, simplicity, and docs hygiene.
- [x] Summarize `core.md` to strategic architecture constraints.
- [x] Add `docs/mcp/debug-mcp-spec.md` as MCP diagnostics contract.

### Phase 1 - No-code UX foundation (shadcn-first)

- [ ] Define registry UX metadata standard for all shadcn components.
- [ ] Standardize drag-drop placement language and visual affordances.
- [ ] Refactor inspector into beginner-first sections.
- [ ] Add smart defaults/templates for table/button/card/filter/chart starter dashboard.
- [ ] Run first-time-user walkthrough and capture friction points.

### Phase 2 - Responsive layout defaults

- [ ] Expand layout schema for responsive stack/grid constraints and wrapping.
- [ ] Add anti-hardcode guidance in properties editor.
- [ ] Add desktop/tablet/mobile viewport presets in preview mode.
- [ ] Add overflow/constraint conflict warnings.
- [ ] Validate runtime/editor consistency across viewport presets.

### Phase 3 - Universal properties and data binding

- [ ] Define binding descriptor schema (static, expression, state path, query path).
- [ ] Build non-technical data source picker and path browser.
- [ ] Add sample-data aware binding preview.
- [ ] Implement reusable property editor primitives for registry-driven UI.
- [ ] Add validation and user-facing messages for broken bindings.

### Phase 4 - Side effects and workflow orchestration

- [ ] Ship simple action-list mode for common workflows.
- [ ] Ship React Flow advanced mode for branching logic.
- [ ] Add action blocks: fetch, set state, transform, condition, modal open/close, notify, navigate.
- [ ] Add scenario template: button click -> fetch -> populate table.
- [ ] Add scenario template: row action -> modal -> submit -> refresh table.
- [ ] Add visibility/interactivity rule builder.

### Phase 5 - Parity and preview contract

- [ ] Enforce single renderer path across editor canvas, preview, and runtime output.
- [ ] Define parity test matrix: same DSL + viewport + data => same result.
- [ ] Add high-priority visual regression snapshots.
- [ ] Ensure preview mode hides editor chrome while preserving behavior.
- [ ] Add parity failure diagnostics surfaced in developer mode.

### Phase 6 - Component adapter strategy

- [ ] Keep shadcn as production default library.
- [ ] Define adapter interface for future UI libraries.
- [ ] Define component capability schema and validator.
- [ ] Create component certification checklist before user exposure.
- [ ] Publish adapter onboarding guide for future component integrations.

### Phase 7 - Diagnostics and Cursor MCP

- [ ] Add issue telemetry envelope in runtime and builder.
- [ ] Add diagnostics panel with trace drilldown for developers.
- [ ] Implement MCP server endpoints from `docs/mcp/debug-mcp-spec.md`.
- [ ] Add redaction policy and sensitive-data masking.
- [ ] Add safe patch guardrails and validation loop for automated fixes.

### Phase 8 - Adoption hardening

- [ ] Add onboarding tour and empty-state education.
- [ ] Add migration assistant for older dashboard DSL versions.
- [ ] Add performance hardening path for large documents.
- [ ] Complete accessibility pass.
- [ ] Complete internationalization readiness pass.

## Done

- **2026-03-31** - Aggressive cleanup wave completed across repository:
  - Builder feature slicing started (`node-tree`, `use-builder-shortcuts`) and `builder-demo` orchestration reduced.
  - Store architecture improved with command-style `commitDocumentChange` and selection reconciliation API (`reconcileSelection`).
  - Runtime lifecycle hardened with `relayout()` API to prevent resize-triggered state resets.
  - Runtime-core diagnostics envelope integrated for schema/layout/logic/runtime failures.
  - Shared utility cleanup: expression truthiness/path-safety reused by logic package.
  - Layout parser duplication removed through shared `parseBoxSides` utility.
  - DSL action validation upgraded to discriminated unions.
  - Registry capabilities scaffold introduced for future adapter-driven extensibility.
  - Verification: `pnpm typecheck`, `pnpm test`, `pnpm lint` passed.
- **2026-03-31** - Phase 0 planning baseline completed:
  - canonical roadmap rewrite
  - non-technical UX-first plan structure
  - phase-gated documentation protocol
  - MCP diagnostics spec bootstrapped
