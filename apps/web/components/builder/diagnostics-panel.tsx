"use client";

import type { AiuiDocument } from "@aiui/dsl-schema";
import { safeParseDocument } from "@aiui/dsl-schema";
import { useEffect, useMemo, useState } from "react";
import { analyzeDocumentPerformance } from "@/lib/builder/document-performance";
import { collectLayoutWarnings } from "@/lib/builder/layout-warnings";
import { buildViewportParityReport } from "@/lib/builder/viewport-parity";
import { createIssueTelemetryEnvelope } from "@/lib/diagnostics/issue-telemetry";
import { useIssueTelemetryStore } from "@/stores/issue-telemetry-store";

function severityClassname(severity: string): string {
  switch (severity) {
    case "error":
      return "text-destructive";
    case "warn":
      return "text-amber-700";
    default:
      return "text-foreground/80";
  }
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function DiagnosticsPanel(props: {
  document: AiuiDocument;
  selectedCount: number;
  undoDepth: number;
  redoDepth: number;
}) {
  const { document, selectedCount, undoDepth, redoDepth } = props;
  const issues = useIssueTelemetryStore((s) => s.issues);
  const recordIssue = useIssueTelemetryStore((s) => s.recordIssue);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [runExpensiveChecks, setRunExpensiveChecks] = useState(false);
  const parse = safeParseDocument(document);
  const perf = useMemo(
    () => analyzeDocumentPerformance(document.root),
    [document.root],
  );
  const shouldRunExpensiveChecks =
    !perf.shouldDeferExpensiveDiagnostics || runExpensiveChecks;
  const layoutWarnings = useMemo(
    () =>
      shouldRunExpensiveChecks ? collectLayoutWarnings(document.root) : [],
    [document.root, shouldRunExpensiveChecks],
  );
  const viewportParity = useMemo(
    () =>
      shouldRunExpensiveChecks
        ? buildViewportParityReport(document.root)
        : {
            ok: true,
            summary:
              "Deferred for large document. Run full checks for parity details.",
            rows: [],
          },
    [document.root, shouldRunExpensiveChecks],
  );
  const failingParityRows = viewportParity.rows.filter(
    (row) => row.invalidRectCount > 0 || !row.deterministic,
  );
  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.issueId === selectedIssueId) ?? issues[0] ?? null,
    [issues, selectedIssueId],
  );

  useEffect(() => {
    if (!parse.success) {
      recordIssue(
        createIssueTelemetryEnvelope({
          source: "builder",
          severity: "error",
          category: "schema",
          code: "BUILDER_SCHEMA_INVALID",
          summary: "Builder document failed schema validation",
          userMessage: "Document structure is invalid. Please review diagnostics.",
          developerMessage: parse.error.issues.map((i) => i.message).join("; "),
          documentVersion: document.version,
          details: {
            issueCount: parse.error.issues.length,
            firstIssue: parse.error.issues[0]?.message,
          },
        }),
      );
    }
  }, [document.version, parse, recordIssue]);

  useEffect(() => {
    if (layoutWarnings.length === 0) return;
    recordIssue(
      createIssueTelemetryEnvelope({
        source: "builder",
        severity: "warn",
        category: "layout",
        code: "BUILDER_LAYOUT_WARNINGS",
        summary: `Builder detected ${layoutWarnings.length} layout warning(s)`,
        userMessage: "Layout warnings were detected for one or more viewports.",
        developerMessage: layoutWarnings[0]?.message ?? "Layout warning detected",
        documentVersion: document.version,
        details: {
          warningCount: layoutWarnings.length,
          firstWarningCode: layoutWarnings[0]?.code,
          firstWarningNodeId: layoutWarnings[0]?.nodeId,
        },
      }),
    );
  }, [document.version, layoutWarnings, recordIssue]);

  useEffect(() => {
    if (failingParityRows.length === 0) return;
    recordIssue(
      createIssueTelemetryEnvelope({
        source: "builder",
        severity: "warn",
        category: "layout",
        code: "VIEWPORT_PARITY_FAILED",
        summary: "Viewport parity checks reported failures",
        userMessage:
          "Preview parity differs across one or more viewport presets.",
        developerMessage: failingParityRows
          .map(
            (row) =>
              `${row.viewportId}: invalidRects=${row.invalidRectCount}, deterministic=${row.deterministic}`,
          )
          .join("; "),
        documentVersion: document.version,
        details: {
          failingViewports: failingParityRows.map((row) => row.viewportId),
          failureCount: failingParityRows.length,
        },
      }),
    );
  }, [document.version, failingParityRows, recordIssue]);

  useEffect(() => {
    if (!perf.isLargeDocument) return;
    recordIssue(
      createIssueTelemetryEnvelope({
        source: "builder",
        severity: perf.scaleLevel === "very_large" ? "warn" : "info",
        category: "performance",
        code: "BUILDER_LARGE_DOCUMENT",
        summary: perf.summary,
        userMessage:
          "Large dashboard detected. Builder enables performance guardrails to keep editing responsive.",
        developerMessage:
          "Large-document guardrails activated; expensive diagnostics are deferred until explicitly enabled.",
        documentVersion: document.version,
        details: {
          nodeCount: perf.nodeCount,
          eventCount: perf.eventCount,
          actionCount: perf.actionCount,
          maxDepth: perf.maxDepth,
          complexityScore: perf.estimatedComplexityScore,
          scaleLevel: perf.scaleLevel,
        },
      }),
    );
  }, [document.version, perf, recordIssue]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Diagnostics
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Schema</span>
          <p className="font-medium text-foreground">
            {parse.success ? "valid" : "invalid"}
          </p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Selected</span>
          <p className="font-medium text-foreground">{selectedCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Nodes</span>
          <p className="font-medium text-foreground">{perf.nodeCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Leaves</span>
          <p className="font-medium text-foreground">{perf.leafCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Events</span>
          <p className="font-medium text-foreground">{perf.eventCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Actions</span>
          <p className="font-medium text-foreground">{perf.actionCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Undo depth</span>
          <p className="font-medium text-foreground">{undoDepth}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Redo depth</span>
          <p className="font-medium text-foreground">{redoDepth}</p>
        </div>
      </div>
      {!parse.success ? (
        <p className="mt-2 text-[0.65rem] text-destructive">
          {parse.error.issues[0]?.message ?? "Document validation failed."}
        </p>
      ) : null}
      <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-2">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Document scale
        </p>
        <p
          className={
            perf.isLargeDocument
              ? "mt-1 text-[0.68rem] text-amber-700"
              : "mt-1 text-[0.68rem] text-emerald-700"
          }
        >
          {perf.summary}
        </p>
        <p className="mt-1 text-[0.68rem] text-foreground/90">
          Depth: {perf.maxDepth} • Complexity score: {perf.estimatedComplexityScore}
        </p>
        {perf.guardrails.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {perf.guardrails.map((guardrail) => (
              <li key={guardrail} className="text-[0.67rem] text-foreground/80">
                {guardrail}
              </li>
            ))}
          </ul>
        ) : null}
        {perf.shouldDeferExpensiveDiagnostics ? (
          <div className="mt-2 rounded border border-amber-300/60 bg-amber-50/70 p-2">
            <p className="text-[0.67rem] text-amber-900">
              Expensive layout/parity checks are deferred while editing this
              document.
            </p>
            <button
              type="button"
              className="mt-1 text-[0.67rem] font-medium text-amber-800 underline underline-offset-2"
              onClick={() => setRunExpensiveChecks((prev) => !prev)}
            >
              {runExpensiveChecks
                ? "Disable full checks"
                : "Run full checks now"}
            </button>
          </div>
        ) : null}
      </div>
      {layoutWarnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50/60 p-2">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-amber-800">
            Layout warnings ({layoutWarnings.length})
          </p>
          <ul className="mt-1 space-y-1">
            {layoutWarnings.slice(0, 6).map((warning) => (
              <li key={`${warning.code}-${warning.nodeId}-${warning.viewport ?? "base"}`}>
                <p className="text-[0.68rem] leading-snug text-amber-900">
                  {warning.message}
                </p>
              </li>
            ))}
          </ul>
          {layoutWarnings.length > 6 ? (
            <p className="mt-1 text-[0.65rem] text-amber-800/90">
              +{layoutWarnings.length - 6} more warnings
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[0.65rem] text-muted-foreground">
          No overflow/constraint conflicts detected for current viewport presets.
        </p>
      )}
      <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-2">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Viewport parity
        </p>
        <p
          className={
            viewportParity.ok
              ? "mt-1 text-[0.68rem] text-emerald-700"
              : "mt-1 text-[0.68rem] text-amber-700"
          }
        >
          {viewportParity.summary}
        </p>
        {viewportParity.rows.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {viewportParity.rows.map((row) => (
              <li key={row.viewportId} className="text-[0.68rem] text-foreground/90">
                {row.viewportLabel} ({row.width}px):{" "}
                {row.invalidRectCount === 0 && row.deterministic
                  ? "ok"
                  : `${row.invalidRectCount} invalid rect(s), deterministic=${row.deterministic}`}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="mt-3 rounded-lg border border-border/70 bg-muted/10 p-2">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Issue telemetry ({issues.length})
        </p>
        {issues.length === 0 ? (
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            No telemetry issues emitted yet.
          </p>
        ) : (
          <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {issues.slice(0, 12).map((issue) => {
                const isSelected = selectedIssue?.issueId === issue.issueId;
                return (
                  <li key={issue.issueId}>
                    <button
                      type="button"
                      onClick={() => setSelectedIssueId(issue.issueId)}
                      className={`w-full rounded border px-2 py-1 text-left text-[0.67rem] leading-snug transition-colors ${
                        isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/70 bg-background/60 hover:border-border"
                      }`}
                    >
                      <p className="flex items-center justify-between gap-2">
                        <span className={`font-mono ${severityClassname(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-muted-foreground">x{issue.occurrences}</span>
                      </p>
                      <p className="truncate text-foreground/90">{issue.summary}</p>
                      <p className="truncate text-muted-foreground">
                        {issue.source} • {issue.category}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedIssue ? (
              <div className="rounded border border-border/70 bg-background/70 p-2 text-[0.67rem]">
                <p className="truncate font-medium text-foreground">{selectedIssue.summary}</p>
                <p className="mt-1 text-muted-foreground">{selectedIssue.userMessage}</p>
                <p className="mt-1 text-foreground/80">{selectedIssue.developerMessage}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                  <p>
                    <span className="text-muted-foreground">source:</span> {selectedIssue.source}
                  </p>
                  <p>
                    <span className="text-muted-foreground">category:</span>{" "}
                    {selectedIssue.category}
                  </p>
                  <p>
                    <span className="text-muted-foreground">code:</span>{" "}
                    {selectedIssue.code ?? "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">nodeId:</span>{" "}
                    {selectedIssue.nodeId ?? "-"}
                  </p>
                  <p className="col-span-2">
                    <span className="text-muted-foreground">timestamp:</span>{" "}
                    {formatTimestamp(selectedIssue.lastSeenAt)}
                  </p>
                  <p className="col-span-2">
                    <span className="text-muted-foreground">trace:</span>{" "}
                    <span className="font-mono text-foreground/90">
                      {selectedIssue.issueId} / {selectedIssue.contextRef}
                    </span>
                  </p>
                  <p className="col-span-2">
                    <span className="text-muted-foreground">doc version:</span>{" "}
                    {selectedIssue.documentVersion}
                  </p>
                </div>
                {selectedIssue.details ? (
                  <div className="mt-2">
                    <p className="text-muted-foreground">details JSON</p>
                    <pre className="mt-1 max-h-28 overflow-auto rounded border border-border/70 bg-muted/30 p-2 font-mono text-[0.64rem] text-foreground/90">
                      {JSON.stringify(selectedIssue.details, null, 2)}
                    </pre>
                  </div>
                ) : null}
                <p className="mt-2 truncate text-[0.63rem] text-muted-foreground">
                  fingerprint: <span className="font-mono">{selectedIssue.fingerprint}</span>
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
