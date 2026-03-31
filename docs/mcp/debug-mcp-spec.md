# AIUI Debug MCP Specification

## Purpose

Provide a Cursor-compatible MCP server that helps developers diagnose and safely fix AIUI builder/runtime issues without exposing technical complexity to end users.

## Version

- Spec version: `0.2.1`
- Status: aligned with builder + runtime issue telemetry envelope integration

## Runtime diagnostics envelope alignment

Runtime issues emitted from `@aiui/runtime-core` should map to this envelope:

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

## Design goals

- Fast issue discovery with structured context.
- Safe, auditable remediation workflow.
- Strict redaction for sensitive payloads.
- Separation between user-facing messages and developer traces.

## Issue model

```json
{
  "issueId": "iss_01J...",
  "source": "builder|runtime|export|layout|logic",
  "severity": "info|warn|error|critical",
  "category": "binding|schema|action|layout|performance|security",
  "summary": "Table rows binding path not found",
  "userMessage": "Data source is disconnected. Reconnect a data source for this table.",
  "developerMessage": "Binding path queries.customers.data does not exist in current state snapshot.",
  "timestamp": "2026-03-31T00:00:00.000Z",
  "documentVersion": "0.2.0",
  "contextRef": "ctx_01J..."
}
```

## MCP tools

### `list_issues`

Returns filtered issue summaries.

**Input**

```json
{
  "severity": ["error", "critical"],
  "category": ["binding", "action"],
  "source": ["runtime", "builder"],
  "limit": 50,
  "cursor": null
}
```

**Output**

```json
{
  "items": [
    {
      "issueId": "iss_01J...",
      "summary": "Table rows binding path not found",
      "severity": "error",
      "source": "runtime",
      "timestamp": "2026-03-31T00:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

### `get_issue_context`

Returns expanded, redacted context for one issue.

**Input**

```json
{
  "issueId": "iss_01J..."
}
```

**Output**

```json
{
  "issueId": "iss_01J...",
  "dslFragment": {},
  "actionTrace": [],
  "layoutSnapshot": {},
  "stateSnapshot": {},
  "redactions": ["queryToken", "authorizationHeader"]
}
```

### `suggest_fix`

Returns candidate fix strategies with confidence and risk score.

**Input**

```json
{
  "issueId": "iss_01J...",
  "strategy": "conservative"
}
```

**Output**

```json
{
  "candidates": [
    {
      "fixId": "fix_01J...",
      "title": "Update binding path to query result root",
      "description": "Replace rows binding from queries.customers.data to queries.customers.rows",
      "risk": "low",
      "confidence": 0.88,
      "patchPreview": []
    }
  ]
}
```

### `apply_safe_fix_patch`

Applies an approved, scope-limited patch.

**Input**

```json
{
  "fixId": "fix_01J...",
  "dryRun": true
}
```

**Output**

```json
{
  "applied": false,
  "dryRun": true,
  "changedFiles": ["apps/web/src/..."],
  "safetyChecks": {
    "schemaValid": true,
    "testsPassed": false,
    "forbiddenPathsTouched": false
  }
}
```

### `validate_fix`

Validates fix impact and regression status.

**Input**

```json
{
  "fixId": "fix_01J..."
}
```

**Output**

```json
{
  "issueResolved": true,
  "newIssues": [],
  "parityCheck": "pass",
  "notes": "No regression in preview/runtime parity snapshots."
}
```

## Redaction and privacy

- Always redact secrets, auth headers, and raw tokens.
- Hash sensitive keys before transport.
- Strip user-entered PII fields unless explicitly allowed by policy.

## Safety rules for automated fixes

- Disallow edits outside approved project scope.
- Block destructive operations by default.
- Require schema validation and parity checks before marking a fix as successful.
- Keep full audit trail of requested, suggested, and applied fixes.

## Integration notes

- End-user UI surfaces only `userMessage`.
- Developer diagnostics panel surfaces trace + issue ids + recommended fixes.
- Cursor consumes MCP tools to inspect issues and execute guarded repair loops.
