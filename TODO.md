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

- [x] Define registry UX metadata standard for all shadcn components.
- [x] Standardize drag-drop placement language and visual affordances.
- [x] Refactor inspector into beginner-first sections.
- [x] Add smart defaults/templates for table/button/card/filter/chart starter dashboard.
- [x] Run first-time-user walkthrough and capture friction points.

### Phase 2 - Responsive layout defaults

- [x] Expand layout schema for responsive stack/grid constraints and wrapping.
- [x] Add anti-hardcode guidance in properties editor.
- [x] Add desktop/tablet/mobile viewport presets in preview mode.
- [x] Add overflow/constraint conflict warnings.
- [x] Validate runtime/editor consistency across viewport presets.

### Phase 3 - Universal properties and data binding

- [x] Define binding descriptor schema (static, expression, state path, query path).
- [x] Build non-technical data source picker and path browser.
- [x] Add sample-data aware binding preview.
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

- **2026-03-31** - Phase 3 sample-data-aware binding preview added:
  - Added sample preview output for in-progress binding drafts (query/state/expression/static).
  - Added live preview values alongside active bindings list for fast validation.
  - Added shared sample state + path resolver utility for consistent preview behavior.
- **2026-03-31** - Phase 3 data source picker + path browser added:
  - Added Data bindings panel in inspector Data section for non-technical binding setup.
  - Added source/path browser backed by sample query datasets and state-path presets.
  - Added binding apply/remove flows writing directly to `node.bindings` (`query`, `state`, `expression`, `static`).
- **2026-03-31** - Phase 3 binding descriptor schema defined:
  - Added discriminated binding descriptor schema in `@aiui/dsl-schema` (`static`, `expression`, `state`, `query`).
  - Added optional `bindings` field on `UiNode` for property-key -> descriptor mapping.
  - Added parser exports and schema tests covering valid/invalid descriptors and document integration.
- **2026-03-31** - Phase 2 viewport parity validation added:
  - Added shared viewport parity validator over desktop/tablet/mobile widths.
  - Added diagnostics reporting for per-viewport validity/determinism checks.
  - Surfaced explicit pass/fail status to track runtime/editor consistency across presets.
- **2026-03-31** - Phase 2 overflow/constraint warnings added:
  - Added layout warning analysis for conflicting min/max bounds and fixed-size constraint violations.
  - Added row-stack overflow detection across desktop/tablet/mobile preset widths when wrapping is disabled.
  - Surfaced warnings in Diagnostics panel with concise actionable guidance.
- **2026-03-31** - Phase 2 preview viewport presets added:
  - Added shared desktop/tablet/mobile viewport preset definitions for responsive simulation.
  - Added preview-mode viewport switcher controls and preset descriptions.
  - Runtime preview now renders inside a width-constrained simulated viewport container.
- **2026-03-31** - Phase 2 anti-hardcode guidance in inspector:
  - Added contextual guidance in the Layout section to discourage fixed width/height unless necessary.
  - Guidance now warns when one or both dimensions are hardcoded and recommends intrinsic/content-driven sizing for responsiveness.
- **2026-03-31** - Phase 2 layout schema expansion (responsive + wrapping):
  - Added typed `UiLayout` schema contract in `@aiui/dsl-schema` with stack/grid constraint fields (`wrap`, `rowGap`, `columnGap`, `minChildWidth`, `gridColumns`, min/max size bounds) plus responsive tablet/mobile overrides.
  - Updated layout-engine row stack behavior to support wrapping with configurable row gaps and minimum child width constraints.
  - Added layout-engine test coverage for row wrapping behavior to lock in expected placement.
- **2026-03-31** - Phase 1 first-time walkthrough + friction capture added:
  - Added an in-builder first-time walkthrough checklist panel with auto-progressed milestones (add layers, mix primitives, rename, multi-select, configure actions).
  - Added friction-note capture UI with persisted notes for iterative UX review.
  - Wired walkthrough panel into main builder flow for immediate hands-on validation.
- **2026-03-31** - Phase 1 starter dashboard smart templates added:
  - Added reusable starter templates for filter bar, KPI cards, table section, and chart section.
  - Added a combined "Starter dashboard" template that composes these primitives in a beginner-friendly flow.
  - Introduced labeled node helpers so template content is self-describing immediately after insertion.
- **2026-03-31** - Phase 1 inspector refactor to beginner-first sections:
  - Properties inspector now renders ordered sections from registry metadata (`Content`, `Data`, `Actions`, `Visibility`, `Layout`, etc.).
  - Layout-scoped controls are grouped under `Layout`; prop fields default to `Content`.
  - Event bindings are presented under `Actions` with section-level guidance and clearer empty-state messaging for upcoming Data/Visibility capabilities.
- **2026-03-31** - Phase 1 drag-drop language + affordances standardized:
  - Added shared drag/drop copy constants for palette, canvas, and overlay states.
  - Unified action wording around add/nest/reorder for first-time-user clarity.
  - Added explicit on-canvas drop affordance label when nesting targets are active.
- **2026-03-31** - Phase 1 registry UX metadata standard implemented:
  - Introduced canonical `ComponentDefinition.ux` contract (`palette`, `inspector`, `capabilities`) in `@aiui/registry`.
  - Migrated existing primitives to standardized UX metadata paths and exposed `getPaletteMeta`.
  - Updated builder palette consumer to read registry metadata from `ux.palette` instead of ad-hoc fields.
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
