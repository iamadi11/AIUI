This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AIUI builder (`apps/web`)

From the **monorepo root**, run `pnpm dev` (see root `package.json`). The home page hosts the **builder**: component palette, canvas, tree, properties, export, layout debug, and logic graph. **Preview** lives at `/preview`.

**Builder UX:** The **canvas** is the same **`@aiui/runtime-core`** view as **Preview** (`AiuiRuntime`). Click a layer to select; **Cmd/Ctrl+Click** toggles multi-select; click empty chrome to deselect; **Esc** clears selection. Double-click a node in the preview or the **label** chip on the selection outline to rename (`props.label`). Selection shows a breadcrumb path for a single layer (or a count for multi-select); full ids are in tooltips / a subtle hover chip. The **component palette** is grouped by category with a **search** field (registry-driven keywords + names).

See `packages/registry/README.md` for palette metadata when adding primitives.

**Layout:** Properties can target `node.layout` (padding, per-side **margin** T/R/B/L, width/height for empty leaves). On the canvas, use the **grip** beside a nested node to **reorder** among siblings; select an **empty** Box/Stack and drag the **resize** handle (bottom-right) to change intrinsic size — values snap to 8px (minimum 32px) and can align to neighboring edges.

**Events:** Configure **When** (preset or custom) and **Visual steps** (state, URL, HTTP, one-level **If**, HTTP body) or **Advanced JSON** for `sequence` / nested logic; blur fields to save.

**Initial state:** Edit `document.state` key/value defaults for expressions and `setState` paths (panel below export).

**Logic graph:** The **Logic** panel renders a read-only React Flow chain from the selected node’s `events`; `sequence` and `condition` are expanded into steps. Click a step to inspect its action JSON; edit bindings in **Properties → Events**.

**Diagnostics:** A dedicated **Diagnostics** panel shows schema validity, selection count, node/leaf/event/action counts, and undo/redo depth.

**Shortcuts & templates:** Open **Keyboard shortcuts** on the builder for undo/redo, Esc, Delete/Backspace, and ⌘/Ctrl+D (duplicate). Use the **Templates** buttons (Row + two boxes, Header / content / footer, Sidebar + content) to insert common layouts under the selection (or under root).

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
