import {
  fixCandidateSchema,
  issueContextSchema,
  issueEnvelopeSchema,
  type FixCandidate,
  type IssueContext,
  type IssueEnvelope,
} from "./types";

export type ApplyFixResult = {
  changedFiles: string[];
  schemaValid: boolean;
  testsPassed: boolean;
  forbiddenPathsTouched: boolean;
};

export type StoredFixCandidate = FixCandidate & {
  applied: boolean;
};

export type DebugIssueRepository = {
  listIssues: () => IssueEnvelope[];
  getIssue: (issueId: string) => IssueEnvelope | null;
  upsertIssue: (issue: IssueEnvelope, context?: IssueContext) => void;
  getIssueContext: (issueId: string) => IssueContext | null;
  listCandidatesForIssue: (issueId: string) => FixCandidate[];
  saveCandidates: (issueId: string, candidates: FixCandidate[]) => void;
  getFixCandidate: (fixId: string) => StoredFixCandidate | null;
  applyCandidate: (fixId: string, dryRun: boolean) => ApplyFixResult;
};

export function createInMemoryDebugIssueRepository(): DebugIssueRepository {
  const issuesById = new Map<string, IssueEnvelope>();
  const contextByIssueId = new Map<string, IssueContext>();
  const fixesById = new Map<string, StoredFixCandidate>();
  const fixesByIssueId = new Map<string, string[]>();

  return {
    listIssues() {
      return Array.from(issuesById.values()).sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp),
      );
    },
    getIssue(issueId) {
      return issuesById.get(issueId) ?? null;
    },
    upsertIssue(issue, context) {
      issuesById.set(issue.issueId, issueEnvelopeSchema.parse(issue));
      if (context) {
        contextByIssueId.set(issue.issueId, issueContextSchema.parse(context));
      }
    },
    getIssueContext(issueId) {
      return contextByIssueId.get(issueId) ?? null;
    },
    listCandidatesForIssue(issueId) {
      const ids = fixesByIssueId.get(issueId) ?? [];
      return ids
        .map((id) => fixesById.get(id))
        .filter((item): item is StoredFixCandidate => Boolean(item))
        .map((item) => item);
    },
    saveCandidates(issueId, candidates) {
      const fixIds: string[] = [];
      for (const candidate of candidates) {
        const parsed = fixCandidateSchema.parse(candidate);
        fixesById.set(parsed.fixId, { ...parsed, applied: false });
        fixIds.push(parsed.fixId);
      }
      fixesByIssueId.set(issueId, fixIds);
    },
    getFixCandidate(fixId) {
      return fixesById.get(fixId) ?? null;
    },
    applyCandidate(fixId, dryRun) {
      const fix = fixesById.get(fixId);
      if (!fix) {
        return {
          changedFiles: [],
          schemaValid: false,
          testsPassed: false,
          forbiddenPathsTouched: false,
        };
      }
      if (!dryRun) {
        fixesById.set(fixId, { ...fix, applied: true });
      }
      const changedFiles =
        fix.patchPreview
          .map((entry) =>
            typeof entry.file === "string" ? (entry.file as string) : null,
          )
          .filter((entry): entry is string => Boolean(entry)) ?? [];
      return {
        changedFiles,
        schemaValid: true,
        testsPassed: false,
        forbiddenPathsTouched: false,
      };
    },
  };
}
