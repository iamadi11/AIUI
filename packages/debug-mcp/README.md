# @aiui/debug-mcp

Phase 7 MCP diagnostics implementation for AIUI.

## What this package provides

- MCP-compatible tool handlers for:
  - `list_issues`
  - `get_issue_context`
  - `suggest_fix`
  - `apply_safe_fix_patch`
  - `validate_fix`
- Strict Zod schema validation for all tool inputs and outputs.
- In-memory repository for issues, issue context, and fix candidates.
- Default ingestion hook (`ingestTelemetryIssue`) to feed issue telemetry from app surfaces.

## Wiring path in this repo

- Telemetry producer: `apps/web/stores/issue-telemetry-store.ts`
- Ingestion hook: `ingestTelemetryIssue(...)`
- Endpoint logic: `packages/debug-mcp/src/tools.ts`

## Notes

- `apply_safe_fix_patch` currently focuses on safe dry-run flow and structured safety checks.
- This baseline is intentionally conservative and non-destructive.
