import { z } from "zod";

export const ISSUE_SOURCE_VALUES = [
  "builder",
  "runtime",
  "export",
  "layout",
  "logic",
  "schema",
] as const;

export const ISSUE_SEVERITY_VALUES = ["info", "warn", "error", "critical"] as const;

export const ISSUE_CATEGORY_VALUES = [
  "binding",
  "schema",
  "action",
  "layout",
  "performance",
  "security",
  "runtime",
] as const;

export const FIX_RISK_VALUES = ["low", "medium", "high"] as const;
export const FIX_STRATEGY_VALUES = ["conservative", "balanced", "aggressive"] as const;

export const issueEnvelopeSchema = z.object({
  issueId: z.string().min(1),
  source: z.enum(ISSUE_SOURCE_VALUES),
  severity: z.enum(ISSUE_SEVERITY_VALUES),
  category: z.enum(ISSUE_CATEGORY_VALUES),
  summary: z.string().min(1),
  userMessage: z.string().min(1),
  developerMessage: z.string().min(1),
  timestamp: z.string().min(1),
  documentVersion: z.string().min(1),
  contextRef: z.string().min(1),
  code: z.string().optional(),
  nodeId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  fingerprint: z.string().min(1),
});

export const issueContextSchema = z.object({
  issueId: z.string().min(1),
  dslFragment: z.record(z.string(), z.unknown()).default({}),
  actionTrace: z.array(z.record(z.string(), z.unknown())).default([]),
  layoutSnapshot: z.record(z.string(), z.unknown()).default({}),
  stateSnapshot: z.record(z.string(), z.unknown()).default({}),
  redactions: z.array(z.string()).default([]),
});

export const fixCandidateSchema = z.object({
  fixId: z.string().min(1),
  issueId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  risk: z.enum(FIX_RISK_VALUES),
  confidence: z.number().min(0).max(1),
  patchPreview: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const listIssuesInputSchema = z.object({
  severity: z.array(z.enum(ISSUE_SEVERITY_VALUES)).optional(),
  category: z.array(z.enum(ISSUE_CATEGORY_VALUES)).optional(),
  source: z.array(z.enum(ISSUE_SOURCE_VALUES)).optional(),
  limit: z.number().int().positive().max(200).default(50),
  cursor: z.string().nullable().optional().default(null),
});

export const listIssuesOutputSchema = z.object({
  items: z.array(
    z.object({
      issueId: z.string().min(1),
      summary: z.string().min(1),
      severity: z.enum(ISSUE_SEVERITY_VALUES),
      source: z.enum(ISSUE_SOURCE_VALUES),
      timestamp: z.string().min(1),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export const getIssueContextInputSchema = z.object({
  issueId: z.string().min(1),
});

export const getIssueContextOutputSchema = issueContextSchema;

export const suggestFixInputSchema = z.object({
  issueId: z.string().min(1),
  strategy: z.enum(FIX_STRATEGY_VALUES).default("conservative"),
});

export const suggestFixOutputSchema = z.object({
  candidates: z.array(
    z.object({
      fixId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      risk: z.enum(FIX_RISK_VALUES),
      confidence: z.number().min(0).max(1),
      patchPreview: z.array(z.record(z.string(), z.unknown())),
    }),
  ),
});

export const applySafeFixPatchInputSchema = z.object({
  fixId: z.string().min(1),
  dryRun: z.boolean().default(true),
});

export const applySafeFixPatchOutputSchema = z.object({
  applied: z.boolean(),
  dryRun: z.boolean(),
  changedFiles: z.array(z.string()),
  safetyChecks: z.object({
    schemaValid: z.boolean(),
    testsPassed: z.boolean(),
    forbiddenPathsTouched: z.boolean(),
  }),
});

export const validateFixInputSchema = z.object({
  fixId: z.string().min(1),
});

export const validateFixOutputSchema = z.object({
  issueResolved: z.boolean(),
  newIssues: z.array(z.string()),
  parityCheck: z.enum(["pass", "fail", "unknown"]),
  notes: z.string(),
});

export type IssueEnvelope = z.infer<typeof issueEnvelopeSchema>;
export type IssueContext = z.infer<typeof issueContextSchema>;
export type FixCandidate = z.infer<typeof fixCandidateSchema>;
