import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";

export type DocumentScaleLevel = "normal" | "large" | "very_large";

/** Stable ids; copy is resolved via i18n in the app layer. */
export type DocumentPerformanceGuardrailId =
  | "deferred_diagnostics"
  | "collapse_large_json"
  | "deep_nesting"
  | "high_action_volume";

export type DocumentPerformanceSummary =
  | { kind: "normal" }
  | {
      kind: "large";
      nodeCount: number;
      actionCount: number;
      maxDepth: number;
    };

export type DocumentPerformanceDiagnostics = {
  nodeCount: number;
  leafCount: number;
  eventCount: number;
  actionCount: number;
  maxDepth: number;
  estimatedComplexityScore: number;
  scaleLevel: DocumentScaleLevel;
  isLargeDocument: boolean;
  shouldDeferExpensiveDiagnostics: boolean;
  guardrailIds: DocumentPerformanceGuardrailId[];
  perfSummary: DocumentPerformanceSummary;
};

const LARGE_DOCUMENT_NODE_THRESHOLD = 120;
const VERY_LARGE_DOCUMENT_NODE_THRESHOLD = 260;
const LARGE_DOCUMENT_ACTION_THRESHOLD = 150;
const VERY_LARGE_DOCUMENT_ACTION_THRESHOLD = 320;
const LARGE_DOCUMENT_DEPTH_THRESHOLD = 8;
const VERY_LARGE_DOCUMENT_DEPTH_THRESHOLD = 12;

export function analyzeDocumentPerformance(
  root: UiNode,
): DocumentPerformanceDiagnostics {
  let nodeCount = 0;
  let leafCount = 0;
  let eventCount = 0;
  let actionCount = 0;
  let maxDepth = 0;

  function walk(node: UiNode, depth: number) {
    nodeCount += 1;
    maxDepth = Math.max(maxDepth, depth);

    const children = node.children ?? [];
    if (children.length === 0) {
      leafCount += 1;
    }

    const events = node.events ?? {};
    for (const actions of Object.values(events)) {
      eventCount += 1;
      actionCount += actions.length;
    }

    for (const child of children) {
      walk(child, depth + 1);
    }
  }

  walk(root, 1);

  const estimatedComplexityScore =
    nodeCount + Math.round(actionCount * 1.2) + Math.round(maxDepth * 3);

  const isVeryLargeByNodes = nodeCount >= VERY_LARGE_DOCUMENT_NODE_THRESHOLD;
  const isVeryLargeByActions = actionCount >= VERY_LARGE_DOCUMENT_ACTION_THRESHOLD;
  const isVeryLargeByDepth = maxDepth >= VERY_LARGE_DOCUMENT_DEPTH_THRESHOLD;
  const isLargeByNodes = nodeCount >= LARGE_DOCUMENT_NODE_THRESHOLD;
  const isLargeByActions = actionCount >= LARGE_DOCUMENT_ACTION_THRESHOLD;
  const isLargeByDepth = maxDepth >= LARGE_DOCUMENT_DEPTH_THRESHOLD;

  let scaleLevel: DocumentScaleLevel = "normal";
  if (isVeryLargeByNodes || isVeryLargeByActions || isVeryLargeByDepth) {
    scaleLevel = "very_large";
  } else if (isLargeByNodes || isLargeByActions || isLargeByDepth) {
    scaleLevel = "large";
  }

  const isLargeDocument = scaleLevel !== "normal";
  const shouldDeferExpensiveDiagnostics = isLargeDocument;

  const guardrailIds: DocumentPerformanceGuardrailId[] = [];
  if (isLargeDocument) {
    guardrailIds.push("deferred_diagnostics");
  }
  if (scaleLevel === "very_large") {
    guardrailIds.push("collapse_large_json");
  }
  if (maxDepth >= LARGE_DOCUMENT_DEPTH_THRESHOLD) {
    guardrailIds.push("deep_nesting");
  }
  if (actionCount >= LARGE_DOCUMENT_ACTION_THRESHOLD) {
    guardrailIds.push("high_action_volume");
  }

  const perfSummary: DocumentPerformanceSummary = isLargeDocument
    ? {
        kind: "large",
        nodeCount,
        actionCount,
        maxDepth,
      }
    : { kind: "normal" };

  return {
    nodeCount,
    leafCount,
    eventCount,
    actionCount,
    maxDepth,
    estimatedComplexityScore,
    scaleLevel,
    isLargeDocument,
    shouldDeferExpensiveDiagnostics,
    guardrailIds,
    perfSummary,
  };
}

/** Aggregate performance across all screens (multi-screen documents). */
export function analyzeDocumentPerformanceFromDoc(
  doc: AiuiDocument,
): DocumentPerformanceDiagnostics {
  let worst: DocumentPerformanceDiagnostics | undefined;
  for (const screen of Object.values(doc.screens)) {
    const p = analyzeDocumentPerformance(screen.root);
    if (
      !worst ||
      p.estimatedComplexityScore > worst.estimatedComplexityScore
    ) {
      worst = p;
    }
  }
  return worst ?? analyzeDocumentPerformance({ id: "x", type: "Box", props: {} });
}
