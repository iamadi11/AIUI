# `@aiui/runtime-core`

Framework-agnostic runtime: validate DSL → `layoutDocument` → DOM + events → `@aiui/logic` actions.

## Monorepo / Next.js (default)

Apps resolve **TypeScript source** via `workspace:*` and `transpilePackages` (see `apps/web/next.config.ts`). No pre-build required for local dev.

```ts
import { render } from "@aiui/runtime-core";
```

## Pre-bundled ESM (CI, external apps)

After `pnpm run build` in this package, consume the Vite output:

```ts
import { render } from "@aiui/runtime-core/bundled";
```

`pnpm run bundle:check` enforces a size budget on `dist/index.mjs`.

## Public API

- `render({ container, config, layoutWidth? })` → `{ update, destroy, getState }`
- Parsing uses `safeParseDocumentWithMigration` from `@aiui/dsl-schema`.

## Publishing (future)

Point the main export at `dist` and ship `dependencies` on `@aiui/dsl-schema`, `@aiui/layout-engine`, `@aiui/logic`, `@aiui/registry`, or ship a single fat bundle via the `bundled` entry.
