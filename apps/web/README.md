This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AIUI builder (`apps/web`)

From the **monorepo root**, run `pnpm dev` (see root `package.json`). The home page hosts the **builder**: component palette, canvas, tree, properties, export, layout debug, and logic graph. **Preview** lives at `/preview`.

**Builder UX:** Click empty canvas to deselect; **Esc** clears selection; double-click a layer **label** on the canvas to rename (Box/Stack `props.label`). Selection shows a breadcrumb path; full ids are in tooltips / a subtle hover chip. The **component palette** is grouped by category with a **search** field (registry-driven keywords + names).

See `packages/registry/README.md` for palette metadata when adding primitives.

**Layout:** Properties can target `node.layout` (padding, width/height for empty leaves). On the canvas, use the **grip** beside a nested node to **reorder** among siblings.

**Events:** Configure **When** (preset or custom) and **Visual steps** (state, URL, HTTP) or **Advanced JSON** for complex actions; blur fields to save.

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

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
