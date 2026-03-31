# `@aiui/runtime-react`

Thin React adapter over `@aiui/runtime-core`: `AiuiRuntime` mounts once, `useLayoutEffect` syncs `document` updates, `ResizeObserver` reflows on width, `destroy` on unmount.

## Monorepo / Next.js (default)

Resolve **source** (same pattern as `runtime-core`):

```tsx
import { AiuiRuntime } from "@aiui/runtime-react";
```

Add `@aiui/runtime-react` to `transpilePackages` in `next.config.ts`.

## Pre-bundled ESM

After `pnpm run build`:

```tsx
import { AiuiRuntime } from "@aiui/runtime-react/bundled";
```

Peers: `react`, `react-dom`, and (transitively) `@aiui/runtime-core` is external in the adapter bundle—use `runtime-core/bundled` or source from the same monorepo.

## Props

- `document: AiuiDocument`
- `className?: string`
