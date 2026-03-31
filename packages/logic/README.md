# `@aiui/logic`

Executes DSL `Action` trees (from `@aiui/dsl-schema`) with injectable side effects — **no `eval`**. Use the same `ActionEnvironment` from tests, Storybook, or `runtime-core`.

## Actions

- **`setState`** — immutable dot-path write into document `state` (see `setPathImmutable`).
- **`navigate`** — calls `env.navigate(href)`.
- **`http`** — `env.fetch` with optional JSON body + `Content-Type`.
- **`sequence`** — runs steps in order (async).
- **`condition`** — evaluates `when` with `@aiui/expression` against `getState()`.

## API

```ts
import { runAction, runActions, type ActionEnvironment } from "@aiui/logic";

await runActions(doc.root.events?.click ?? [], env);
```
