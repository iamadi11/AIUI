# `@aiui/expression`

Safe expression evaluation for AIUI logic — **no `eval`**. Parses a small expression language to an AST and evaluates it against a plain object context.

## Features

- Literals (number, string, boolean, null), dotted paths (`state.count`), arithmetic and comparisons, `&&` / `||` (short-circuit), unary `!` and `-`.
- `interpolateTemplate` for `{{ expression }}` segments.
- Path segments `__proto__`, `constructor`, `prototype` are rejected.

## API

```ts
import { evaluateExpression, interpolateTemplate } from "@aiui/expression";

evaluateExpression("user.name + '!' ", { user: { name: "Ada" } });
interpolateTemplate("Hi {{ user.name }}", { user: { name: "Ada" } });
```
