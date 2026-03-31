# Adapter Onboarding Guide

This guide defines how to add a new UI-library adapter to AIUI after the default `shadcn` baseline.

## 1) Implement the adapter contract

Use `UiAdapterDefinition` from `@aiui/registry` and provide:

- stable `id` (for example `mantine`, `chakra`, `custom-acme`)
- `displayName`, `packageName`, `version`
- `supportedTypes`
- `getDefinition(type)`
- `listDefinitions()`

Keep the adapter as a typed boundary; avoid app-level conditional rendering logic based on library names.

## 2) Register component definitions

For each component:

- define `type`, `displayName`, and `defaultProps`
- include complete `ux.palette`, `ux.inspector`, and `ux.capabilities`
- validate capabilities with `validateComponentCapabilities()`

Ensure palette/inspector metadata stays beginner-friendly and non-technical.

## 3) Validate capability and parity readiness

- Run `pnpm typecheck`.
- Run targeted checks for touched packages/apps.
- Validate capability metadata (field types, layout modes, and flag consistency).
- Check viewport behavior in preview developer mode (`/preview?dev=1`) and ensure parity diagnostics are clean.

## 4) Certify before exposure

Before enabling components in default palette flows, complete:

- `docs/adapters/component-certification-checklist.md`

Do not expose uncertified components to non-technical users.

## 5) Documentation and rollout

- Update `packages/registry/README.md` if adapter contract usage changed.
- Update `TODO.md` and `cursor.md` with durable lessons/follow-ups.
- If adapter introduces new diagnostics or security constraints, update relevant docs under `docs/`.
