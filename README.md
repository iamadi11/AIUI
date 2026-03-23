# DynaUI (AIUI monorepo)

AI-assisted, schema-aware dashboards: paste a **public HTTPS JSON** endpoint or raw JSON, run a fast **rule-based** layout pass, then optionally refine with **Claude** using a **schema-only** payload (no raw values).

## Stack (current)

| Area | Choice |
|------|--------|
| App | **Next.js 16** (App Router, Turbopack in dev/build) |
| UI | **React 19**, **Tailwind CSS v4** (`@tailwindcss/postcss`), **Radix UI**, **CVA**, **tailwind-merge** v3 |
| Charts | **Recharts 3** |
| Icons | **lucide-react** 1.x |
| AI | **@anthropic-ai/sdk** (Claude) on the server only |
| Monorepo | **pnpm** 10 + **Turbo** |
| Tests | **Vitest** 4 |

Design: **OKLCH** tokens, **semantic** utilities (`background`, `foreground`, `card`, `muted`, `border`, `ring`, `primary`, `destructive`, `chart-1` / `chart-2`), **Inter** via `next/font`, `text-balance` / `text-pretty`, focus-visible rings, and `prefers-color-scheme` light/dark without a separate toggle (add a theme switch later if you want).

## Packages

| Package | Role |
|--------|------|
| [`@dynaui/core`](packages/core) | Ingestion, `DataNode` analysis, schema signature, rule engine, `ComponentPlan`, AI request DTOs |
| [`@dynaui/ui`](packages/ui) | shadcn-style primitives (Radix + Tailwind + CVA) |
| [`@dynaui/react`](packages/react) | `DynaDashboard`, `DynaPlanRenderer`, widget registry |
| [`@dynaui/webcomponents`](packages/webcomponents) | Standalone `<dynaui-dashboard>` build (ESM + IIFE + CSS), Tailwind v4 in `wc.css` |
| [`web`](apps/web) | Next.js playground, `/api/proxy-fetch`, `/api/infer-layout` |

## Development

The repo uses [`.npmrc`](.npmrc) **`shamefully-hoist=true`** so pnpm lays out dependencies like npm. That avoids duplicate React instances and broken Next.js client chunks (`Cannot read properties of undefined (reading 'call')` in RSC) in this monorepo.

```bash
pnpm install
pnpm exec turbo run build   # builds core + WC; Next consumes `@dynaui/core` from `dist`
pnpm dev                    # turbo dev — or `cd apps/web && pnpm dev`
```

Copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env.local` and set `ANTHROPIC_API_KEY` for Claude layout refinement.

**Lint:** Next.js 16 removed `next lint`; this app uses **`eslint .`** with [`eslint-config-next`](https://nextjs.org/docs/app/api-reference/config/eslint) flat presets (`core-web-vitals` + `typescript`). Run `pnpm run lint` from `apps/web`.

## Embedding the Web Component

After `pnpm exec turbo run build --filter=@dynaui/webcomponents`:

```html
<link rel="stylesheet" href="./dist/dynaui-wc.css" />
<script type="module" src="./dist/dynaui-wc.iife.js"></script>
<!-- or ESM: import './dist/dynaui-wc.esm.js' -->

<dynaui-dashboard id="dash"></dynaui-dashboard>
<script>
  const el = document.getElementById("dash");
  el.payload = JSON.stringify([{ name: "A", v: 1 }, { name: "B", v: 2 }]);
</script>
```

The `payload` property must be a JSON string. The bundle is large because it includes React, Recharts, and the widget set—trade space for drop-in use outside React.

## Security notes

- The playground proxy enforces **HTTPS**, blocks common **SSRF** targets, and caps response size.
- Claude requests are built from **types/paths/hints only**; automated tests assert typical user secrets do not appear in the serialized AI payload (`@dynaui/core` tests).

## Scripts (root)

- `pnpm build` — `turbo run build`
- `pnpm test` — `turbo run test`
- `pnpm typecheck` — `turbo run typecheck`
