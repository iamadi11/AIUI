This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AIUI builder (`apps/web`)

From the **monorepo root**, run `pnpm dev` (see root `package.json`). The home page hosts the **builder**.

**Product direction (see repo [`PLAN.md`](../../PLAN.md)):** **one page** built on a **full-window React Flow canvas** — **drag and drop** from the palette to compose the dashboard. **Preview** (`/preview`) must show the **same** runtime output as the canvas for the same document (parity). Configuration uses contextual panels (e.g. **Sheet** for properties); **`?dev=1`** adds tree, export, diagnostics, and optional advanced views.

**Builder UX (target):** The **canvas** uses the same **`@aiui/runtime-core`** view as **Preview** where possible. Click to select; keyboard shortcuts and selection behavior as implemented in code. The **component palette** is registry-driven (see [`packages/registry/README.md`](../../packages/registry/README.md)).

**Layout & events:** Inspector sections are registry-driven. Canvas affordances (reorder, resize where supported) should match runtime layout rules.

**Initial state:** Document state defaults for expressions and `setState` paths live in the document model (see builder panels).

**Diagnostics:** With **`?dev=1`**, diagnostics and optional logic visualization are available without cluttering the default builder.

See [`packages/registry/README.md`](../../packages/registry/README.md) for palette metadata when adding primitives.

## Getting Started

First, run the development server (from repo root, `pnpm dev`):

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out [the Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) to learn more.
