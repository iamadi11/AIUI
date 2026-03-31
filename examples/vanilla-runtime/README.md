# Vanilla `@aiui/runtime-core` example

From the repo root (after `pnpm install`):

```bash
pnpm --filter vanilla-runtime-example dev
```

Opens Vite on port **5174** with a minimal `render({ container, config })` against a single `Box` root.

The web app (`apps/web`) uses the React adapter (`@aiui/runtime-react`); this folder shows the same pipeline without React.
