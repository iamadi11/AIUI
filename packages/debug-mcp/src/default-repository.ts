import { createInMemoryDebugIssueRepository } from "./repository";
import type { IssueContext, IssueEnvelope } from "./types";

export type IssueTelemetryLike = {
  issueId: string;
  source: IssueEnvelope["source"];
  severity: IssueEnvelope["severity"];
  category: IssueEnvelope["category"];
  summary: string;
  userMessage: string;
  developerMessage: string;
  timestamp: string;
  documentVersion: string;
  contextRef: string;
  code?: string;
  nodeId?: string;
  details?: Record<string, unknown>;
  fingerprint: string;
};

export const defaultDebugIssueRepository = createInMemoryDebugIssueRepository();

export function ingestTelemetryIssue(issue: IssueTelemetryLike): void {
  const context: IssueContext = {
    issueId: issue.issueId,
    dslFragment: issue.nodeId ? { nodeId: issue.nodeId } : {},
    actionTrace: Array.isArray(issue.details?.actionTrace)
      ? (issue.details?.actionTrace as Record<string, unknown>[])
      : [],
    layoutSnapshot:
      issue.details && typeof issue.details.layoutSnapshot === "object"
        ? (issue.details.layoutSnapshot as Record<string, unknown>)
        : {},
    stateSnapshot:
      issue.details && typeof issue.details.stateSnapshot === "object"
        ? (issue.details.stateSnapshot as Record<string, unknown>)
        : {},
    redactions: [],
  };
  defaultDebugIssueRepository.upsertIssue(issue, context);
}
