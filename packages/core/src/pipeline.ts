import { buildDataTree } from "./analysis.js";
import { normalizeRootValue, parseInput } from "./ingest.js";
import { generateSchemaSignature } from "./signature.js";
import { runRuleSelection } from "./select.js";
import { mergeConfig } from "./config.js";
import type {
  AIInferenceResponsePayload,
  ComponentPlan,
  DynaUIConfig,
  ReasoningTrace,
  SelectionRule,
} from "./types.js";
import {
  buildMultiPlanFromAI,
  planFromCandidate,
} from "./plan.js";
import { buildAIInferencePayload } from "./ai-serialize.js";
import { defaultRules } from "./rules.js";

export interface PipelineOptions {
  globalConfig?: DynaUIConfig;
  instanceConfig?: DynaUIConfig;
  rules?: SelectionRule[];
  aiResponse?: AIInferenceResponsePayload | null;
  confidenceThreshold?: number;
  /** When true, always attach `aiPayload` for optional Claude refinement even if the rule path is confident. */
  alwaysIncludeAIPayload?: boolean;
}

export interface PipelineResult {
  data: unknown;
  plan: ComponentPlan;
  trace: ReasoningTrace;
  aiPayload?: ReturnType<typeof buildAIInferencePayload>;
  needsAI: boolean;
}

export function runPipeline(
  rawInput: unknown,
  options: PipelineOptions = {},
): PipelineResult {
  const t0 = performance.now();
  const cfg = mergeConfig(options.globalConfig, options.instanceConfig);
  const threshold =
    options.confidenceThreshold ?? cfg.confidenceThreshold ?? 0.85;

  const data = normalizeRootValue(parseInput(rawInput));
  const t1 = performance.now();
  const root = buildDataTree(data);
  const sig = generateSchemaSignature(root);
  const t2 = performance.now();

  const selection = runRuleSelection(
    root,
    options.rules ?? defaultRules,
    threshold,
  );
  const t3 = performance.now();

  const fallbackCandidate = {
    componentId: "JsonFallback",
    score: 0.2,
    ruleId: "scalar-json",
  };

  const top = selection.top ?? fallbackCandidate;

  let plan: ComponentPlan;
  let path: ReasoningTrace["path"];
  let selected: string;

  if (cfg.forceComponent) {
    plan = planFromCandidate(
      {
        componentId: cfg.forceComponent,
        score: 1,
        ruleId: "forced",
      },
      root,
    );
    path = "PINNED";
    selected = cfg.forceComponent;
  } else if (options.aiResponse?.rankedComponents?.length) {
    const base = planFromCandidate(top, root);
    plan = buildMultiPlanFromAI(root, options.aiResponse, base);
    path = "AI";
    selected = plan.componentId;
  } else {
    plan = planFromCandidate(top, root);
    path = "RULE";
    selected = top.componentId;
  }

  const trace: ReasoningTrace = {
    schemaSignature: sig,
    analysisMs: t2 - t1,
    selectionMs: t3 - t2,
    totalMs: performance.now() - t0,
    path,
    candidates: selection.candidates.map((c) => ({
      componentId: c.componentId,
      score: c.score,
      ruleId: c.ruleId,
      aiReasoning: c.aiReasoning,
    })),
    selected,
    configOverrides: [],
    warnings: [],
  };

  const needsAI = selection.needsAI && !options.aiResponse?.rankedComponents?.length;
  const aiPayload =
    needsAI || options.alwaysIncludeAIPayload
      ? buildAIInferencePayload(root, selection.candidates)
      : undefined;

  return { data, plan, trace, aiPayload, needsAI };
}

/* ------------------------------------------------------------------ */
/*  Multi-source pipeline                                             */
/* ------------------------------------------------------------------ */

export interface MultiSourceInput {
  id: string;
  label?: string;
  data: unknown;
}

export interface MultiPipelineResult {
  plan: ComponentPlan;
  dataSources: Record<string, unknown>;
  traces: Record<string, ReasoningTrace>;
  perSource: Record<string, PipelineResult>;
  needsAI: boolean;
}

/**
 * Run the pipeline independently for each data source then combine into a
 * single `DashboardShell` plan.  For a single source this delegates straight
 * to `runPipeline` so existing behaviour is preserved.
 */
export function runMultiPipeline(
  sources: MultiSourceInput[],
  options: PipelineOptions = {},
): MultiPipelineResult {
  if (sources.length === 0) {
    const empty = runPipeline(null, options);
    return {
      plan: empty.plan,
      dataSources: {},
      traces: {},
      perSource: {},
      needsAI: empty.needsAI,
    };
  }

  if (sources.length === 1) {
    const s = sources[0]!;
    const result = runPipeline(s.data, options);
    const plan: ComponentPlan = {
      ...result.plan,
      sourceId: s.id,
      props: { ...result.plan.props, title: s.label || result.plan.props?.title },
    };
    return {
      plan,
      dataSources: { [s.id]: result.data },
      traces: { [s.id]: result.trace },
      perSource: { [s.id]: result },
      needsAI: result.needsAI,
    };
  }

  const dataSources: Record<string, unknown> = {};
  const traces: Record<string, ReasoningTrace> = {};
  const perSource: Record<string, PipelineResult> = {};
  let anyNeedsAI = false;

  const children: ComponentPlan[] = [];

  for (const s of sources) {
    const result = runPipeline(s.data, { ...options, aiResponse: null });
    dataSources[s.id] = result.data;
    traces[s.id] = result.trace;
    perSource[s.id] = result;
    if (result.needsAI) anyNeedsAI = true;

    children.push({
      ...result.plan,
      sourceId: s.id,
      props: { ...result.plan.props, title: s.label || result.plan.props?.title },
    });
  }

  const plan: ComponentPlan = {
    componentId: "DashboardShell",
    props: { title: "Multi-Source Dashboard" },
    children,
    dataPath: [],
    interactions: [{ trigger: "refresh", action: "none" }],
  };

  return { plan, dataSources, traces, perSource, needsAI: anyNeedsAI };
}
