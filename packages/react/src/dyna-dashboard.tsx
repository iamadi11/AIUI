"use client";

import { useMemo } from "react";
import type {
  AIInferenceResponsePayload,
  ComponentPlan,
  DynaUIConfig,
  ReasoningTrace,
} from "@dynaui/core";
import { runPipeline } from "@dynaui/core";
import { Button } from "@dynaui/ui";
import { DynaPlanRenderer } from "./dyna-plan-renderer";

export interface DynaDashboardProps {
  data: unknown;
  plan?: ComponentPlan;
  globalConfig?: DynaUIConfig;
  instanceConfig?: DynaUIConfig;
  aiResponse?: AIInferenceResponsePayload | null;
  showTrace?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  dataSources?: Record<string, unknown>;
}

export function DynaDashboard({
  data,
  plan: planOverride,
  globalConfig,
  instanceConfig,
  aiResponse,
  showTrace = true,
  onRefresh,
  isLoading,
  dataSources,
}: DynaDashboardProps) {
  const pipeline = useMemo(() => {
    if (planOverride) {
      return {
        plan: planOverride,
        trace: null as ReasoningTrace | null,
        needsAI: false,
        aiPayload: undefined,
      };
    }
    return runPipeline(data, {
      globalConfig,
      instanceConfig,
      aiResponse: aiResponse ?? undefined,
    });
  }, [data, planOverride, globalConfig, instanceConfig, aiResponse]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh data
          </Button>
        ) : null}
        {isLoading ? (
          <span className="text-sm text-muted-foreground">Loading…</span>
        ) : null}
      </div>
      <DynaPlanRenderer data={data} plan={pipeline.plan} dataSources={dataSources} />
      {showTrace && pipeline.trace ? (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Reasoning trace
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(
              {
                path: pipeline.trace.path,
                selected: pipeline.trace.selected,
                candidates: pipeline.trace.candidates,
                schemaSignature: pipeline.trace.schemaSignature,
                timingsMs: {
                  analysis: pipeline.trace.analysisMs,
                  selection: pipeline.trace.selectionMs,
                  total: pipeline.trace.totalMs,
                },
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

export type { AIInferenceResponsePayload, ComponentPlan };
