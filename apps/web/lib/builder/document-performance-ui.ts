import { msg } from "@/lib/i18n/messages";
import type {
  DocumentPerformanceDiagnostics,
  DocumentPerformanceGuardrailId,
} from "./document-performance";

export function guardrailMessage(id: DocumentPerformanceGuardrailId): string {
  switch (id) {
    case "deferred_diagnostics":
      return msg("diagnostics.guardrailDeferred");
    case "collapse_large_json":
      return msg("diagnostics.guardrailCollapseJson");
    case "deep_nesting":
      return msg("diagnostics.guardrailDeepNesting");
    case "high_action_volume":
      return msg("diagnostics.guardrailHighActions");
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function formatPerfSummaryLine(
  perf: DocumentPerformanceDiagnostics,
): string {
  if (perf.perfSummary.kind === "normal") {
    return msg("diagnostics.perfSummaryNormal");
  }
  const { nodeCount, actionCount, maxDepth } = perf.perfSummary;
  return msg("diagnostics.perfSummaryLarge", {
    nodeCount,
    actionCount,
    maxDepth,
  });
}

