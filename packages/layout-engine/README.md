# `@aiui/layout-engine`

Deterministic layout for AIUI DSL nodes — **no React**. Produces `Map<nodeId, Rect>` in root coordinates.

## Supported subset (`LAYOUT_VERSION`)

- **Box** — column of children (gap `0`), optional `layout.padding` and `layout.margin` (number or `{ top, right, bottom, left }`). Margin is outside the node’s border box and affects sibling spacing.
- **Stack** — `props.direction` `row` | `column` (default column), `props.gap` (px, non-negative), same padding and margin as Box.
- **Leaves** — default intrinsic size `32×32` unless overridden via `intrinsics` map, or via **`layout.width`** and **`layout.height`** (both required and ≥ min leaf) for empty containers.

## Not yet

- Grid, text measurement (see `measure.ts` stub), DOM reads.

## API

```ts
import { layoutDocument } from "@aiui/layout-engine";

const rects = layoutDocument(root, { width: 400 });
```
