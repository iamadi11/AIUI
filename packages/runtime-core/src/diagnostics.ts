export type DiagnosticSeverity = "info" | "warn" | "error" | "critical";
export type DiagnosticSource = "runtime" | "layout" | "logic" | "schema";

export type RuntimeDiagnostic = {
  code: string;
  summary: string;
  severity: DiagnosticSeverity;
  source: DiagnosticSource;
  nodeId?: string;
  details?: Record<string, unknown>;
};

export type DiagnosticsSink = (issue: RuntimeDiagnostic) => void;

export function defaultDiagnosticsSink(issue: RuntimeDiagnostic): void {
  const level =
    issue.severity === "error" || issue.severity === "critical"
      ? "error"
      : issue.severity === "warn"
        ? "warn"
        : "info";
  console[level](`[aiui:${issue.source}] ${issue.code} - ${issue.summary}`, issue);
}
