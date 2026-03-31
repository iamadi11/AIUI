# `@aiui/layout-engine`

Deterministic layout for AIUI DSL nodes — **no React**. Produces `Map<nodeId, Rect>` in root coordinates.

## Supported subset (`LAYOUT_VERSION`)

- **Box** — column of children (gap `0`), optional `layout.padding` (number or `{ top, right, bottom, left }`).
- **Stack** — `props.direction` `row` | `column` (default column), `props.gap` (px, non-negative), same padding as Box.
- **Leaves** — default intrinsic size `32×32` unless overridden via `intrinsics` map.

## Not yet

- Grid, text measurement (see `measure.ts` stub), DOM reads.

## API

```ts
import { layoutDocument } from "@aiui/layout-engine";

const rects = layoutDocument(root, { width: 400 });
```
