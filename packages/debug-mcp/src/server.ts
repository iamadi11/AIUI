import {
  applySafeFixPatchInputSchema,
  getIssueContextInputSchema,
  listIssuesInputSchema,
  suggestFixInputSchema,
  validateFixInputSchema,
} from "./types";
import type { DebugMcpTools } from "./tools";

export type DebugMcpToolName =
  | "list_issues"
  | "get_issue_context"
  | "suggest_fix"
  | "apply_safe_fix_patch"
  | "validate_fix";

export type DebugMcpToolDefinition = {
  name: DebugMcpToolName;
  description: string;
  inputSchema: object;
  execute: (args: unknown) => unknown;
};

export function createDebugMcpToolDefinitions(tools: DebugMcpTools): DebugMcpToolDefinition[] {
  return [
    {
      name: "list_issues",
      description: "Return filtered issue summaries with cursor pagination.",
      inputSchema: listIssuesInputSchema.shape,
      execute: (args) => tools.list_issues(args),
    },
    {
      name: "get_issue_context",
      description: "Return expanded and redacted context for a specific issue.",
      inputSchema: getIssueContextInputSchema.shape,
      execute: (args) => tools.get_issue_context(args),
    },
    {
      name: "suggest_fix",
      description: "Suggest candidate fixes with risk and confidence metadata.",
      inputSchema: suggestFixInputSchema.shape,
      execute: (args) => tools.suggest_fix(args),
    },
    {
      name: "apply_safe_fix_patch",
      description: "Apply or dry-run a scoped safe fix patch candidate.",
      inputSchema: applySafeFixPatchInputSchema.shape,
      execute: (args) => tools.apply_safe_fix_patch(args),
    },
    {
      name: "validate_fix",
      description: "Validate fix impact and report parity/regression status.",
      inputSchema: validateFixInputSchema.shape,
      execute: (args) => tools.validate_fix(args),
    },
  ];
}
