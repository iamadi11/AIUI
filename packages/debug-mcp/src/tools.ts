import {
  applySafeFixPatchInputSchema,
  applySafeFixPatchOutputSchema,
  getIssueContextInputSchema,
  getIssueContextOutputSchema,
  ISSUE_CATEGORY_VALUES,
  listIssuesInputSchema,
  listIssuesOutputSchema,
  suggestFixInputSchema,
  suggestFixOutputSchema,
  validateFixInputSchema,
  validateFixOutputSchema,
  type FixCandidate,
  type IssueContext,
  type IssueEnvelope,
} from "./types";
import type { DebugIssueRepository } from "./repository";

function defaultContextForIssue(issue: IssueEnvelope): IssueContext {
  return {
    issueId: issue.issueId,
    dslFragment: issue.nodeId ? { nodeId: issue.nodeId } : {},
    actionTrace: [],
    layoutSnapshot: {},
    stateSnapshot: {},
    redactions: [],
  };
}

function buildFixId(issueId: string, index: number): string {
  const suffix = `${Date.now().toString(36)}${index.toString(36)}`;
  return `fix_${issueId.replace(/^iss_/, "").slice(0, 8)}_${suffix}`;
}

function computeRisk(category: (typeof ISSUE_CATEGORY_VALUES)[number]): "low" | "medium" | "high" {
  if (category === "security") return "high";
  if (category === "schema" || category === "action") return "medium";
  return "low";
}

function buildHeuristicCandidates(issue: IssueEnvelope): FixCandidate[] {
  const risk = computeRisk(issue.category);
  const baseTitle =
    issue.category === "binding"
      ? "Update broken binding path"
      : issue.category === "layout"
        ? "Adjust layout constraints for target viewport"
        : issue.category === "schema"
          ? "Align document shape with schema"
          : "Apply targeted runtime-safe correction";
  const baseDescription =
    issue.category === "binding"
      ? "Inspect unresolved path and remap to an existing state/query root."
      : issue.category === "layout"
        ? "Relax fixed size constraints and re-run viewport parity checks."
        : issue.category === "schema"
          ? "Correct invalid node properties against the current DSL schema."
          : "Constrain the fix to issue scope and verify diagnostics parity.";

  return [
    {
      fixId: buildFixId(issue.issueId, 0),
      issueId: issue.issueId,
      title: baseTitle,
      description: `${baseDescription} (code=${issue.code ?? "unknown"})`,
      risk,
      confidence: issue.category === "binding" ? 0.88 : issue.category === "layout" ? 0.81 : 0.74,
      patchPreview: [],
    },
  ];
}

export function createDebugMcpTools(repository: DebugIssueRepository) {
  return {
    list_issues(input: unknown) {
      const parsed = listIssuesInputSchema.parse(input ?? {});
      const items = repository
        .listIssues()
        .filter((issue) =>
          parsed.severity && parsed.severity.length > 0
            ? parsed.severity.includes(issue.severity)
            : true,
        )
        .filter((issue) =>
          parsed.category && parsed.category.length > 0
            ? parsed.category.includes(issue.category)
            : true,
        )
        .filter((issue) =>
          parsed.source && parsed.source.length > 0 ? parsed.source.includes(issue.source) : true,
        );

      const startIndex = parsed.cursor
        ? Math.max(
            items.findIndex((item) => item.issueId === parsed.cursor) + 1,
            0,
          )
        : 0;
      const paged = items.slice(startIndex, startIndex + parsed.limit);
      const nextCursor =
        startIndex + parsed.limit < items.length ? paged[paged.length - 1]?.issueId ?? null : null;

      return listIssuesOutputSchema.parse({
        items: paged.map((issue) => ({
          issueId: issue.issueId,
          summary: issue.summary,
          severity: issue.severity,
          source: issue.source,
          timestamp: issue.timestamp,
        })),
        nextCursor,
      });
    },

    get_issue_context(input: unknown) {
      const parsed = getIssueContextInputSchema.parse(input);
      const issue = repository.getIssue(parsed.issueId);
      if (!issue) {
        throw new Error(`Issue not found: ${parsed.issueId}`);
      }
      const stored = repository.getIssueContext(parsed.issueId);
      const context = stored ?? defaultContextForIssue(issue);
      return getIssueContextOutputSchema.parse(context);
    },

    suggest_fix(input: unknown) {
      const parsed = suggestFixInputSchema.parse(input);
      const issue = repository.getIssue(parsed.issueId);
      if (!issue) {
        throw new Error(`Issue not found: ${parsed.issueId}`);
      }
      const existing = repository.listCandidatesForIssue(parsed.issueId);
      const candidates =
        existing.length > 0 ? existing : buildHeuristicCandidates(issue).map((c) => ({ ...c }));
      if (existing.length === 0) {
        repository.saveCandidates(parsed.issueId, candidates);
      }
      return suggestFixOutputSchema.parse({
        candidates: candidates.map((candidate) => ({
          fixId: candidate.fixId,
          title: candidate.title,
          description: candidate.description,
          risk: candidate.risk,
          confidence: candidate.confidence,
          patchPreview: candidate.patchPreview,
        })),
      });
    },

    apply_safe_fix_patch(input: unknown) {
      const parsed = applySafeFixPatchInputSchema.parse(input);
      const fix = repository.getFixCandidate(parsed.fixId);
      if (!fix) {
        throw new Error(`Fix not found: ${parsed.fixId}`);
      }
      const result = repository.applyCandidate(parsed.fixId, parsed.dryRun);
      return applySafeFixPatchOutputSchema.parse({
        applied: !parsed.dryRun,
        dryRun: parsed.dryRun,
        changedFiles: result.changedFiles,
        safetyChecks: {
          schemaValid: result.schemaValid,
          testsPassed: result.testsPassed,
          forbiddenPathsTouched: result.forbiddenPathsTouched,
        },
      });
    },

    validate_fix(input: unknown) {
      const parsed = validateFixInputSchema.parse(input);
      const fix = repository.getFixCandidate(parsed.fixId);
      if (!fix) {
        throw new Error(`Fix not found: ${parsed.fixId}`);
      }
      const notes = fix.applied
        ? "Fix marked as applied in repository; rerun parity/runtime diagnostics for full confirmation."
        : "Fix has not been applied yet. Run apply_safe_fix_patch first.";
      return validateFixOutputSchema.parse({
        issueResolved: false,
        newIssues: [],
        parityCheck: "unknown",
        notes,
      });
    },
  };
}

export type DebugMcpTools = ReturnType<typeof createDebugMcpTools>;
