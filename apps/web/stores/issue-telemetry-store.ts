import { create } from "zustand";
import type { IssueTelemetryEnvelope } from "@/lib/diagnostics/issue-telemetry";

type StoredIssue = IssueTelemetryEnvelope & {
  occurrences: number;
  lastSeenAt: string;
};

type IssueTelemetryState = {
  issues: StoredIssue[];
  recordIssue: (issue: IssueTelemetryEnvelope) => void;
  clearIssues: () => void;
};

const MAX_ISSUES = 200;

export const useIssueTelemetryStore = create<IssueTelemetryState>((set) => ({
  issues: [],
  recordIssue: (issue) => {
    set((state) => {
      const idx = state.issues.findIndex((i) => i.fingerprint === issue.fingerprint);
      if (idx < 0) {
        const next: StoredIssue[] = [
          { ...issue, occurrences: 1, lastSeenAt: issue.timestamp },
          ...state.issues,
        ];
        return { issues: next.slice(0, MAX_ISSUES) };
      }
      const prev = state.issues[idx];
      const merged: StoredIssue = {
        ...prev,
        ...issue,
        issueId: prev.issueId,
        contextRef: prev.contextRef,
        occurrences: prev.occurrences + 1,
        lastSeenAt: issue.timestamp,
      };
      const without = state.issues.filter((_, i) => i !== idx);
      return { issues: [merged, ...without].slice(0, MAX_ISSUES) };
    });
  },
  clearIssues: () => set({ issues: [] }),
}));
