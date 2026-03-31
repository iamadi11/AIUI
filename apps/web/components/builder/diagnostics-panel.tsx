"use client";

import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { safeParseDocument } from "@aiui/dsl-schema";
import { useEffect } from "react";
import { collectLayoutWarnings } from "@/lib/builder/layout-warnings";
import { buildViewportParityReport } from "@/lib/builder/viewport-parity";
import { createIssueTelemetryEnvelope } from "@/lib/diagnostics/issue-telemetry";
import { useIssueTelemetryStore } from "@/stores/issue-telemetry-store";

function countTree(root: UiNode): {
  nodeCount: number;
  leafCount: number;
  eventCount: number;
  actionCount: number;
} {
  let nodeCount = 0;
  let leafCount = 0;
  let eventCount = 0;
  let actionCount = 0;

  function walk(node: UiNode) {
    nodeCount += 1;
    const kids = node.children ?? [];
    if (kids.length === 0) {
      leafCount += 1;
    }
    const events = node.events ?? {};
    for (const actions of Object.values(events)) {
      eventCount += 1;
      actionCount += actions.length;
    }
    for (const child of kids) walk(child);
  }

  walk(root);
  return { nodeCount, leafCount, eventCount, actionCount };
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
  const parse = safeParseDocument(document);
  const tree = countTree(document.root);
  const layoutWarnings = collectLayoutWarnings(document.root);
  const viewportParity = buildViewportParityReport(document.root);
  const failingParityRows = viewportParity.rows.filter(
    (row) => row.invalidRectCount > 0 || !row.deterministic,
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
          <p className="font-medium text-foreground">{tree.nodeCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Leaves</span>
          <p className="font-medium text-foreground">{tree.leafCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Events</span>
          <p className="font-medium text-foreground">{tree.eventCount}</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/25 px-2 py-1">
          <span className="text-muted-foreground">Actions</span>
          <p className="font-medium text-foreground">{tree.actionCount}</p>
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
          <ul className="mt-1 space-y-1">
            {issues.slice(0, 5).map((issue) => (
              <li key={issue.issueId} className="text-[0.68rem] leading-snug">
                <span className="font-mono text-foreground/80">{issue.severity}</span>{" "}
                <span className="text-foreground/90">{issue.summary}</span>{" "}
                <span className="text-muted-foreground">
                  ({issue.source}, x{issue.occurrences})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
