# AIUI — Execution backlog

Tracks the roadmap in [`PLAN.md`](PLAN.md). Phase checklist below is **complete**; use git history for granular completion notes before 2026-04-01.

## Phase checklist (0–8)

All items below are done unless marked otherwise.

- [x] **Phase 0** — Canonical `PLAN.md` / `TODO.md` / `cursor.md` / `core.md`; MCP spec bootstrapped.
- [x] **Phase 1** — Registry UX metadata; DnD affordances; beginner inspector; templates + walkthrough.
- [x] **Phase 2** — Responsive layout schema; viewport presets; overflow warnings; parity across presets.
- [x] **Phase 3** — Binding descriptors; data picker; sample preview; reusable field editors; validation UX.
- [x] **Phase 4** — Action list + React Flow; fetch/transform/modal/notify/etc.; scenario templates; visibility rules.
- [x] **Phase 5** — Single `RuntimeSurface` path; visual snapshots; preview chrome toggle; dev parity diagnostics.
- [x] **Phase 6** — Adapter interface; capability schema + validator; certification checklist; onboarding guide.
- [x] **Phase 7** — Issue telemetry; diagnostics panel; `@aiui/debug-mcp`; redaction; safe-fix guardrails.
- [x] **Phase 8** — Onboarding; migration assistant; large-doc guardrails; a11y; i18n message keys.

## Recently completed (2026-03-31)

- Minimal builder: **navbar** (palette + Preview + More); main canvas + properties; **Advanced** → `/?dev=1` for full dev panels.
- **Preview** (`/preview`): download / copy / import JSON; **Edit** → `/`; optional **Developer preview** → `?dev=1`.
- Shared **golden JSON** export logic: [`apps/web/lib/builder/golden-document-export.ts`](apps/web/lib/builder/golden-document-export.ts), [`use-golden-document-export.ts`](apps/web/lib/builder/use-golden-document-export.ts).
- **Runtime** (`@aiui/runtime-core`): paints labels and sample table UI for Button, Input, Badge, Card (leaf), Table (leaf or title overlay when composed).
- **Registry**: `defaultChildren` starter trees for Card and Table; `interactionPresets` on Button and Table; Events panel uses presets when present.
- **Canvas**: right-click menu (configure / duplicate / remove non-root).

## Next (optional)

- [ ] Optional React shadcn renderer path if imperative DOM is not enough for visual parity.
- [ ] Extend `interactionPresets` across more primitives and tune copy.
