import type { ComponentCandidate, DataNode, SelectionRule } from "./types.js";
import { defaultRules } from "./rules.js";

const DEFAULT_THRESHOLD = 0.85;

export interface RuleSelectionResult {
  candidates: ComponentCandidate[];
  top: ComponentCandidate | null;
  needsAI: boolean;
}

export function runRuleSelection(
  schema: DataNode,
  rules: SelectionRule[] = defaultRules,
  confidenceThreshold: number = DEFAULT_THRESHOLD,
): RuleSelectionResult {
  const passing = rules.filter((r) => r.condition(schema));
  const scored: ComponentCandidate[] = passing.map((r) => ({
    componentId: r.componentId,
    score: r.score(schema),
    ruleId: r.id,
    configDefaults: r.configDefaults,
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = rules.find((x) => x.id === a.ruleId)?.priority ?? 999;
    const pb = rules.find((x) => x.id === b.ruleId)?.priority ?? 999;
    return pa - pb;
  });
  const top = scored[0] ?? null;
  const needsAI =
    !top ||
    top.score < confidenceThreshold ||
    passing.length === 0;
  return { candidates: scored.slice(0, 5), top, needsAI };
}
