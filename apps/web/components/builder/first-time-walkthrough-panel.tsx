"use client";

import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

type WalkthroughStep = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
};

type QuickAction = {
  id: string;
  label: string;
  onClick: () => void;
};

function countNodes(root: UiNode): number {
  let total = 0;
  function walk(node: UiNode) {
    total += 1;
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return total;
}

function hasNamedLayer(root: UiNode): boolean {
  let found = false;
  function walk(node: UiNode) {
    if (found) return;
    const label = node.props?.label;
    if (typeof label === "string" && label.trim().length > 0) {
      found = true;
      return;
    }
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return found;
}

function hasNestedLayout(root: UiNode): boolean {
  let nested = false;
  function walk(node: UiNode) {
    if (nested) return;
    if ((node.children?.length ?? 0) > 0) nested = true;
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return nested;
}

export function FirstTimeWalkthroughPanel(props: {
  document: AiuiDocument;
  selectedCount: number;
  onAddBox: () => void;
  onAddStack: () => void;
  onInsertStarterTemplate: () => void;
}) {
  const { document, selectedCount, onAddBox, onAddStack, onInsertStarterTemplate } = props;

  const totalNodes = useMemo(() => countNodes(document.root), [document.root]);
  const userLayerCount = Math.max(0, totalNodes - 1);
  const namedLayer = useMemo(() => hasNamedLayer(document.root), [document.root]);
  const nestedLayout = useMemo(() => hasNestedLayout(document.root), [document.root]);
  const hasSelection = selectedCount > 0;

  const steps: WalkthroughStep[] = useMemo(
    () => [
      {
        id: "first-layer",
        label: msg("walkthrough.stepFirstLayer"),
        done: userLayerCount >= 1,
        hint: msg("walkthrough.stepFirstLayerHint"),
      },
      {
        id: "structure",
        label: msg("walkthrough.stepStructure"),
        done: nestedLayout || userLayerCount >= 3,
        hint: msg("walkthrough.stepStructureHint"),
      },
      {
        id: "select",
        label: msg("walkthrough.stepSelect"),
        done: hasSelection,
        hint: msg("walkthrough.stepSelectHint"),
      },
      {
        id: "name",
        label: msg("walkthrough.stepName"),
        done: namedLayer,
        hint: msg("walkthrough.stepNameHint"),
      },
    ],
    [hasSelection, namedLayer, nestedLayout, userLayerCount],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const isEmpty = userLayerCount === 0;
  const isNearEmpty = userLayerCount > 0 && userLayerCount <= 2;
  const complete = doneCount >= 3;
  const nextHint = steps.find((step) => !step.done)?.hint;

  const quickActions: QuickAction[] = [
    { id: "box", label: msg("walkthrough.addBox"), onClick: onAddBox },
    { id: "stack", label: msg("walkthrough.addStack"), onClick: onAddStack },
    {
      id: "starter",
      label: msg("walkthrough.useStarterDashboard"),
      onClick: onInsertStarterTemplate,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {msg("walkthrough.quickStart")}
        </p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
          {doneCount}/{steps.length}
        </span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        {msg("walkthrough.buildFirstScreen")}
      </p>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="rounded-md border border-border/70 bg-muted/10 px-2.5 py-2"
          >
            <div className="flex items-start gap-2">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.label}</p>
                {step.hint ? (
                  <p className="text-[0.7rem] leading-snug text-muted-foreground">
                    {step.hint}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-md border border-border/70 bg-muted/10 px-2.5 py-2 text-xs">
        {complete ? (
          <p className="text-emerald-700">
            {msg("walkthrough.momentum")}
          </p>
        ) : isEmpty ? (
          <p className="text-muted-foreground">
            {msg("walkthrough.canvasEmpty")}
          </p>
        ) : isNearEmpty ? (
          <p className="text-muted-foreground">
            {msg("walkthrough.canvasNearEmpty")}
          </p>
        ) : (
          <p className="text-muted-foreground">{nextHint}</p>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {msg("walkthrough.quickActions")}
        </p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant={action.id === "starter" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
          <Link
            href="/preview"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 gap-1 text-xs",
            )}
          >
            <Sparkles className="size-3.5" aria-hidden />
            {msg("builder.preview")}
          </Link>
        </div>
      </div>
    </div>
  );
}
