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
- [x] Implement reusable property editor primitives for registry-driven UI.
- [x] Add validation and user-facing messages for broken bindings.

### Phase 4 - Side effects and workflow orchestration

- [x] Ship simple action-list mode for common workflows.
- [x] Ship React Flow advanced mode for branching logic.
- [x] Add action blocks: fetch, set state, transform, condition, modal open/close, notify, navigate.
- [x] Add scenario template: button click -> fetch -> populate table.
- [x] Add scenario template: row action -> modal -> submit -> refresh table.
- [x] Add visibility/interactivity rule builder.

### Phase 5 - Parity and preview contract

- [x] Enforce single renderer path across editor canvas, preview, and runtime output.
- [x] Define parity test matrix: same DSL + viewport + data => same result.
- [x] Add high-priority visual regression snapshots.
- [x] Ensure preview mode hides editor chrome while preserving behavior.
- [x] Add parity failure diagnostics surfaced in developer mode.

### Phase 6 - Component adapter strategy

- [x] Keep shadcn as production default library.
- [x] Define adapter interface for future UI libraries.
- [x] Define component capability schema and validator.
- [x] Create component certification checklist before user exposure.
- [x] Publish adapter onboarding guide for future component integrations.

### Phase 7 - Diagnostics and Cursor MCP

- [x] Add issue telemetry envelope in runtime and builder.
- [x] Add diagnostics panel with trace drilldown for developers.
- [x] Implement MCP server endpoints from `docs/mcp/debug-mcp-spec.md`.
- [x] Add redaction policy and sensitive-data masking.
- [x] Add safe patch guardrails and validation loop for automated fixes.

### Phase 8 - Adoption hardening

- [x] Add onboarding tour and empty-state education.
- [x] Add migration assistant for older dashboard DSL versions.
- [ ] Add performance hardening path for large documents.
- [ ] Complete accessibility pass.
- [ ] Complete internationalization readiness pass.

## Done

- **2026-03-31** - Phase 8 migration assistant for older dashboard DSL versions added:
  - Added `inspectGoldenJsonImport()` in `@aiui/dsl-schema` to detect version/default migrations and return import guidance metadata.
  - Added builder import confirmation UX that shows migration warnings and requires explicit "Migrate and import" acceptance before replacing the active document.
  - Added schema tests covering migration-assistant reporting for legacy versions and missing metadata defaults.
- **2026-03-31** - Phase 8 onboarding + empty-state education added:
  - Replaced internal first-time QA checklist with a non-technical quick-start onboarding panel focused on first actions and simple progress.
  - Added clear call-to-action buttons (add box, add stack, starter dashboard, preview) directly in onboarding to reduce first-screen friction.
  - Added empty/near-empty document guidance in builder surfaces with progressive hints as users add content.
- **2026-03-31** - Phase 7 MCP debug endpoint baseline implemented:
  - Added `@aiui/debug-mcp` package with concrete tool handlers matching spec names: `list_issues`, `get_issue_context`, `suggest_fix`, `apply_safe_fix_patch`, `validate_fix`.
  - Added strict Zod input/output schemas for all MCP operations and typed issue/fix models for consistent structured responses.
  - Wired builder/runtime issue telemetry ingestion into default MCP issue repository via `ingestTelemetryIssue()` for immediate issue availability in tool queries.
  - Added first-pass safe-fix workflow with risk/confidence scoring, dry-run apply support, and explicit safety checks (`schemaValid`, `testsPassed`, `forbiddenPathsTouched`).
- **2026-03-31** - Phase 7 diagnostics trace drilldown added in builder diagnostics panel:
  - Added compact issue trace list with selection state and occurrence counts for recent telemetry events.
  - Added per-trace drilldown metadata (`source`, `category`, `code`, `nodeId`, timestamp, trace ids, document version, fingerprint).
  - Added details JSON viewer plus user/developer message surfaces to speed issue triage without leaving builder UI.
- **2026-03-31** - Phase 7 issue telemetry envelope wired across runtime + builder:
  - Added shared telemetry envelope model (`issueId`, `contextRef`, category/source/severity, fingerprint) with automatic sensitive-key redaction for details payloads.
  - Routed `@aiui/runtime-core` diagnostics through runtime React/app surfaces so builder canvas and preview runtime both emit structured issues.
  - Added in-memory issue telemetry store with fingerprint-based deduplication and surfaced recent telemetry events in builder diagnostics.
- **2026-03-31** - Phase 5 preview mode now hides editor chrome by default:
  - `/preview` now opens in a runtime-first chrome-hidden surface without editor diagnostics panels.
  - Added opt-in developer mode (`/preview?dev=1`) to keep schema status and viewport controls available when needed.
  - Runtime behavior remains on the same shared `RuntimeSurface` render path to preserve parity.
- **2026-03-31** - Phase 5 parity failure diagnostics surfaced in preview developer mode:
  - Added parity diagnostics section to `/preview?dev=1` using shared viewport parity report generation.
  - Diagnostics now show per-viewport invalid-rect and deterministic status with pass/fail summary.
  - Added actionable remediation guidance when one or more viewport presets fail parity checks.
- **2026-03-31** - Phase 6 adapter interface defined for future UI libraries:
  - Added `UiAdapterDefinition` contract in `@aiui/registry` with stable identification and component-resolution methods.
  - Added default `SHADCN_ADAPTER` implementation as the production adapter baseline.
  - Documented adapter contract usage in registry README to prevent app-level hardcoded integration paths.
- **2026-03-31** - Phase 6 component capability schema and validator added:
  - Added `COMPONENT_CAPABILITY_SCHEMA` in `@aiui/registry` as the canonical capability contract.
  - Added `validateComponentCapabilities()` and `validateCapabilitiesForType()` to enforce capability metadata shape and consistency.
  - Validation now catches invalid boolean fields, unsupported layout modes, and contradictory action capability combinations.
- **2026-03-31** - Phase 6 component certification checklist added:
  - Added `docs/adapters/component-certification-checklist.md` as a pre-exposure gate for new adapter components.
  - Checklist covers metadata contract, runtime parity, UX safety, and required verification steps.
  - Linked checklist from registry docs so adapter work has one visible certification path.
- **2026-03-31** - Phase 6 adapter onboarding guide published:
  - Added `docs/adapters/adapter-onboarding-guide.md` with step-by-step integration flow for future UI libraries.
  - Guide covers adapter contract, capability validation, parity checks, certification, and documentation rollout.
  - Linked onboarding guide from registry docs so future adapter work follows a single documented process.
- **2026-03-31** - Phase 5 single renderer path enforced:
  - Added shared `RuntimeSurface` component used by both builder canvas and preview surfaces.
  - Replaced direct `AiuiRuntime` usage in app-level surfaces with the shared runtime host wrapper.
  - Locked app rendering parity to one host mount path before adding further preview/developer diagnostics.
- **2026-03-31** - Phase 5 visual regression snapshots added:
  - Added runtime visual snapshot tests for high-priority primitives/layouts (`Stack`, `Button`, `Card`, `Badge`) at desktop and mobile widths.
  - Snapshot artifacts are committed under runtime-core test snapshots to catch style/layout drift in CI.
  - Snapshot coverage complements parity matrix tests by locking expected rendered visual style output, not only state parity.
- **2026-03-31** - Phase 5 parity test matrix defined and enforced:
  - Added runtime-core parity matrix test over desktop/tablet/mobile-like widths and multiple initial data states.
  - Test asserts deterministic parity for both initial render and post-interaction state transition when DSL, viewport, and initial data are identical.
  - Added DOM snapshot comparison + runtime state parity assertions to lock regression risk in CI.
- **2026-03-31** - Phase 6 shadcn default library baseline enforced:
  - Expanded registry palette with shadcn-first primitives (`Button`, `Input`, `Card`, `Table`, `Badge`) so they are visible in the builder's left components navbar.
  - Added inspector metadata/capabilities for new primitives to keep no-code editing beginner-friendly and consistent.
  - Added runtime primitive styling for the new component types so preview/output remains visibly mapped after placement.
- **2026-03-31** - Phase 4 visibility/interactivity rule builder added:
  - Added guided rule inputs for `visibleWhen` and `interactiveWhen` expressions in the Visibility section.
  - Persisted rules on the node under a stable props key for later runtime parity consumption.
  - Replaced placeholder copy with actionable authoring controls and examples.
- **2026-03-31** - Phase 4 scenario template added (`row action -> modal -> submit -> refresh`):
  - Added one-click row-action workflow template in Events panel.
  - Template wires modal open/close, submit fetch, table refresh fetch, and success notify in sequence.
  - Uses a custom `rowAction` event scaffold for easy adaptation to table row controls.
- **2026-03-31** - Phase 4 scenario template added (`click -> fetch -> populate table`):
  - Added one-click workflow template in Events panel for common table-loading flow.
  - Template seeds/overwrites `click` event with fetch action mapped to `table.rows`.
  - Keeps template editable in simple visual action-list mode after insertion.
- **2026-03-31** - Phase 4 action blocks expanded across DSL + runtime + builder:
  - Added action schema/runtime support for `fetch`, `transform`, `modal`, and `notify` alongside existing `setState`, `navigate`, and `condition`.
  - Added visual builder blocks/fields for fetch assignment, transform expressions, modal open/close, and notification messages.
  - Added logic test coverage for new action execution paths (state assignment, expression transform, notify/modal hooks).
- **2026-03-31** - Phase 4 React Flow advanced mode shipped for branching logic:
  - Added an inline advanced flow graph panel directly in event JSON editor mode.
  - Reused flow expansion logic so `condition`/branching actions render as a visual path map.
  - Kept graph mode read-only and synchronized with JSON edits for deterministic behavior.
- **2026-03-31** - Phase 4 simple action-list mode shipped for common workflows:
  - Added a beginner-first visual event action editor with simple/advanced mode switching.
  - Added visual step controls for common actions (`setState`, `navigate`, `http`, one-level `condition`) without JSON editing.
  - Added action step reordering controls so users can adjust execution order directly in simple mode.
- **2026-03-31** - Phase 3 broken-binding validation + user messages added:
  - Added per-mode binding validation for query/state/expression descriptors.
  - Added draft-time validation messaging with clear success/warning feedback.
  - Added active-binding health status (OK vs warning) with actionable copy.
- **2026-03-31** - Phase 3 reusable property editor primitives implemented:
  - Extracted registry field renderer primitives into shared builder module.
  - Centralized inspector field scope/value parsing and control rendering for text/select/number/margin sides.
  - Refactored Properties inspector to consume reusable primitives instead of inline one-off field logic.
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
