import type {
  AIInferenceResponsePayload,
  ComponentCandidate,
  ComponentPlan,
  DataNode,
  InteractionSpec,
} from "./types.js";
import { FieldType } from "./types.js";

function defaultInteractions(componentId: string): InteractionSpec[] {
  if (componentId === "DataTable") {
    return [{ trigger: "rowClick", action: "expand", path: [] }];
  }
  if (componentId === "CardGrid" || componentId === "PropertyCard") {
    return [{ trigger: "cardClick", action: "panel", path: [] }];
  }
  if (componentId === "DashboardShell") {
    return [{ trigger: "refresh", action: "none" }];
  }
  return [{ trigger: "refresh", action: "none" }];
}

export function buildRootPlan(
  componentId: string,
  props?: Record<string, unknown>,
  dataPath: string[] = [],
): ComponentPlan {
  return {
    componentId,
    props,
    dataPath,
    interactions: defaultInteractions(componentId),
  };
}

export function planFromCandidate(
  candidate: ComponentCandidate,
  schema: DataNode,
): ComponentPlan {
  const props = {
    ...(candidate.configDefaults ?? {}),
    title: inferTitle(schema),
  };
  return buildRootPlan(candidate.componentId, props, []);
}

function inferTitle(schema: DataNode): string {
  if (schema.path.length === 0) {
    if (schema.inferredType === FieldType.ARRAY) return "Dataset";
    if (schema.inferredType === FieldType.OBJECT) return "Overview";
  }
  return "Data";
}

export function mergeAIResponseIntoPlan(
  base: ComponentPlan,
  schema: DataNode,
  candidate: ComponentCandidate,
  ai: AIInferenceResponsePayload | null,
): ComponentPlan {
  if (!ai?.rankedComponents?.length) {
    return planFromCandidate(candidate, schema);
  }
  const pick = ai.rankedComponents[0];
  if (!pick?.componentId) return base;
  return {
    ...base,
    componentId: pick.componentId,
    props: {
      ...base.props,
      aiReasoning: pick.reasoning,
      layoutHints: ai.layoutHints,
    },
    interactions: defaultInteractions(pick.componentId),
  };
}

export function buildMultiPlanFromAI(
  schema: DataNode,
  ai: AIInferenceResponsePayload,
  fallback: ComponentPlan,
): ComponentPlan {
  const ids = ai.rankedComponents?.map((r) => r.componentId).filter(Boolean) ?? [];
  if (ids.length <= 1) {
    const c: ComponentCandidate = {
      componentId: ids[0] ?? fallback.componentId,
      score: ai.rankedComponents?.[0]?.score ?? 0.5,
      aiReasoning: ai.rankedComponents?.[0]?.reasoning,
    };
    return mergeAIResponseIntoPlan(fallback, schema, c, ai);
  }
  return {
    componentId: "DashboardShell",
    props: {
      layoutHints: ai.layoutHints,
    },
    children: ids.map((id, i) => ({
      componentId: id,
      props: {
        title: ai.rankedComponents?.[i]?.reasoning?.slice(0, 80),
      },
      dataPath: [],
      interactions: defaultInteractions(id),
    })),
    dataPath: [],
    interactions: [{ trigger: "refresh", action: "none" }],
  };
}
