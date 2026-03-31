This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AIUI builder (`apps/web`)

From the **monorepo root**, run `pnpm dev` (see root `package.json`). The home page hosts the **builder**.

**Product direction (see repo [`PLAN.md`](../../PLAN.md)):** **one page** composed on the **page graph** (React Flow tree of layers) with **drag-and-drop** from the palette. Each node shows a data-driven **shadcn-style preview**; the full **runtime** output for the same document JSON is viewed via **`/preview`**. With a **single screen**, the **screen map** (multi-screen React Flow) is hidden so the graph uses the full workspace; with **multiple screens**, use **Open screen map** when you need to wire navigation. Configuration uses contextual panels (e.g. **Sheet**); **`?dev=1`** adds tree, export, diagnostics, and optional advanced views.

**Builder UX:** The **primary workspace** is the page graph. **Preview** (`/preview`) uses **`@aiui/runtime-core`** for pixel-accurate layout of the same DSL. The **component palette** is registry-driven (see [`packages/registry/README.md`](../../packages/registry/README.md)).

**Layout & events:** Inspector sections are registry-driven. Reorder/resize on the old runtime canvas surface are removed; structure is edited via the graph and properties.

**Data & state:** Use the **Data & state** control in the navbar to edit **initial document state**, see sample binding source ids, and apply the **fetch → table** state starter. Per-component bindings stay in the properties sheet when a layer is selected.

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
