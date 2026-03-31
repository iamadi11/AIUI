# AIUI — Execution backlog

Tracks the **current** phased roadmap in [`PLAN.md`](PLAN.md) (north star: **single-page, full-window React Flow canvas**, **drag-and-drop structure**, **preview parity**).

## Legacy completion (reference)

The **previous** phase checklist **0–8** (registry, layout, bindings, actions, parity, adapters, MCP, onboarding) is **done** in code; see **“Legacy roadmap”** at the bottom of [`PLAN.md`](PLAN.md). This file lists **forward work** for the **2026-04 dashboard revamp**.

---

## Phase 0 — Plan alignment

- [x] Confirm single-page primary scope; multi-screen explicitly deferred to Phase 8+ in [`PLAN.md`](PLAN.md).
- [x] Ensure `core.md`, `cursor.md`, `apps/web/README.md`, and `.cursor/skills/aiui-platform/SKILL.md` match [`PLAN.md`](PLAN.md) (no contradictory builder descriptions).

## Phase 1 — Full-window page canvas

- [ ] Builder workspace: **React Flow** as the **dominant** full-area canvas for the one-page tree (palette + minimal chrome).
- [ ] **Palette → canvas** DnD is the default path for adding top-level structure (audit: no mandatory alternate tree for basic flows).

## Phase 2 — Preview parity

- [ ] Audit all builder surfaces that render DSL; **eliminate or align** any second render path vs `/preview`.
- [ ] Document or automate a **canvas vs preview** smoke checklist (same JSON, same viewport).

## Phase 3 — Props on drop + lean inspector

- [ ] **Drop-time defaults** wired from registry (and thin app helpers) for new nodes.
- [ ] **Inspector audit:** remove redundant fields and duplicate controls; section order from registry metadata.

## Phase 4 — State and data UX

- [ ] Single clear story for **document state** + **data sources** (no duplicate panels).
- [ ] Happy-path **fetch → populate** without JSON for standard templates.

## Phase 5 — Bindings

- [ ] Binding authoring matches runtime `kind` model; validation UX next to controls.
- [ ] Export/import round-trip tests for binding scenarios used in demos.

## Phase 6 — Actions and CTAs

- [ ] **Action templates** and step ordering in visual mode for non-technical users.
- [ ] **Advanced** logic graph remains optional (`?dev=1` or equivalent).

## Phase 7 — Hardening

- [ ] Diagnostics + MCP docs in sync with behavior; redaction unchanged unless envelopes change.
- [ ] i18n keys for new copy; a11y spot-check on builder shell; large-doc responsiveness.

## Phase 8+ — Multi-screen (optional)

- [ ] If product needs it: reconcile **screen graph** with single-page clarity (mode switch or secondary entry); avoid confusing single-page users.

---

## Done (meta)

- [x] **2026-04** — Reset roadmap in [`PLAN.md`](PLAN.md) for **React Flow = one page**, **DnD-first dashboard**, **preview parity**, phased plan documented.
- [x] **2026-04** — Phase 0 doc alignment: `core.md`, `cursor.md`, `apps/web/README.md`, `aiui-platform` skill updated to match.
