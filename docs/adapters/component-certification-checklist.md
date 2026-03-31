# Component Certification Checklist

Use this checklist before exposing any adapter component in builder palette defaults.

## 1) Contract and metadata

- [ ] Component has a stable `type` and user-facing `displayName`.
- [ ] `ux.palette` metadata exists (`category`, meaningful `description`, search `keywords`).
- [ ] `ux.inspector` metadata exists with beginner-first fields and section mapping.
- [ ] `ux.capabilities` passes `validateComponentCapabilities()` with no issues.

## 2) Runtime and parity behavior

- [ ] Component renders through the shared runtime path used by builder canvas and preview.
- [ ] Component behaves consistently across desktop/tablet/mobile viewport presets.
- [ ] No deterministic layout drift across repeated render passes.
- [ ] Component interactions do not break event/action execution.

## 3) UX quality and safety

- [ ] Empty/default state is useful and non-technical (no raw ids or schema jargon).
- [ ] Inspector controls avoid requiring raw JSON edits for common tasks.
- [ ] Visibility/interactivity and data-binding affordances are clear (if supported).
- [ ] Capability flags do not overstate support (for example, row actions only when implemented).

## 4) Validation and docs

- [ ] `pnpm typecheck` passes.
- [ ] Targeted lint/checks for touched packages pass.
- [ ] `TODO.md` and `cursor.md` are updated if this certification closes planned work.
- [ ] Adapter docs are updated with any new onboarding or integration requirements.

## Certification decision

- **Status:** `certified` | `blocked`
- **Reviewed by:** `<name>`
- **Date:** `<yyyy-mm-dd>`
- **Notes / blockers:** `<details>`
