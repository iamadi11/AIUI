# AIUI Debug MCP specification

## Purpose

Cursor-facing MCP server for diagnosing and fixing builder/runtime issues **without** exposing technical detail to end users.

## Version

- **Spec:** `0.2.1`
- **Status:** aligned with runtime issue telemetry envelope

## Runtime diagnostics envelope

Issues from `@aiui/runtime-core` should map to:

```json
{
  "code": "ACTION_EXECUTION_FAILED",
  "source": "runtime|layout|logic|schema",
  "severity": "info|warn|error|critical",
  "summary": "Action execution failed",
  "nodeId": "optional-node-id",
  "details": {}
}
```

## Issue model (summary)

| Field | Notes |
|-------|--------|
| `issueId`, `source`, `severity`, `category`, `summary` | Required for list/filter |
| `userMessage` / `developerMessage` | Split UX |
| `timestamp`, `documentVersion`, `contextRef` | Traceability |

Full JSON shape is unchanged from prior revisions; see `packages/debug-mcp` types for authoritative fields.

## MCP tools

| Tool | Role |
|------|------|
| `list_issues` | Filtered summaries (`severity`, `category`, `source`, `limit`, `cursor`) |
| `get_issue_context` | One issue: DSL fragment, traces, snapshots (redacted) |
| `suggest_fix` | Candidates with `risk`, `confidence`, `patchPreview` |
| `apply_safe_fix_patch` | Scoped apply; supports `dryRun`; returns `safetyChecks` |
| `validate_fix` | Regression / parity notes |

Request/response bodies follow the JSON patterns in `packages/debug-mcp` Zod schemas (single source of truth for field names).

## Redaction and safety

- Redact secrets, auth headers, tokens; hash sensitive keys when logging.
- Automated fixes: schema validation, parity checks, forbidden paths, audit trail; non-destructive by default.

## Integration

- Product UI: `userMessage` only.
- Developer surfaces: traces + ids + MCP workflow.
- Implementation: [`packages/debug-mcp`](../../packages/debug-mcp) (`@aiui/debug-mcp`).
