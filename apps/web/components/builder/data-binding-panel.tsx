"use client";

import type { BindingDescriptor, UiNode } from "@aiui/dsl-schema";
import { useMemo, useState } from "react";
import { formatValueForInput } from "@/lib/builder/event-actions";
import { validateBindingDescriptorSchema } from "@/lib/builder/binding-schema";
import {
  SAMPLE_DATA_SOURCES,
  SAMPLE_STATE,
  SAMPLE_STATE_PATHS,
  listDataPaths,
  resolveDataPath,
} from "@/lib/builder/sample-data-sources";
import { msg } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type BindingMode = BindingDescriptor["kind"];

function formatPreview(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function evaluateBindingPreview(binding: BindingDescriptor): unknown {
  if (binding.kind === "static") return binding.value;
  if (binding.kind === "state") {
    const resolved = resolveDataPath(SAMPLE_STATE, binding.path);
    return resolved === undefined ? binding.fallback : resolved;
  }
  if (binding.kind === "query") {
    const sourceData = SAMPLE_DATA_SOURCES[binding.source];
    const resolved = resolveDataPath(sourceData, binding.path);
    return resolved === undefined ? binding.fallback : resolved;
  }
  const tokenized = binding.expression.replace(
    /\{\{\s*([^}]+)\s*\}\}/g,
    (_, rawPath: string) => {
      const p = rawPath.trim();
      const fromState = resolveDataPath(SAMPLE_STATE, p);
      if (fromState !== undefined) return formatPreview(fromState);
      const [src, ...rest] = p.split(".");
      const srcVal = SAMPLE_DATA_SOURCES[src];
      if (srcVal !== undefined) {
        const resolved = resolveDataPath(srcVal, rest.join("."));
        if (resolved !== undefined) return formatPreview(resolved);
      }
      return `{{${p}}}`;
    },
  );
  return tokenized;
}

function validateBindingSample(binding: BindingDescriptor): string | null {
  if (binding.kind === "query") {
    if (!binding.source.trim()) return "Pick a data source.";
    if (!binding.path.trim()) return "Pick a query path.";
    const sourceData = SAMPLE_DATA_SOURCES[binding.source];
    if (sourceData === undefined) return "Data source not found.";
    const resolved = resolveDataPath(sourceData, binding.path);
    if (resolved === undefined && binding.fallback === undefined) {
      return "Path not found in sample data. Add fallback or choose another path.";
    }
    return null;
  }
  if (binding.kind === "state") {
    if (!binding.path.trim()) return "Pick a state path.";
    const resolved = resolveDataPath(SAMPLE_STATE, binding.path);
    if (resolved === undefined && binding.fallback === undefined) {
      return "State path not found in sample state. Add fallback or choose another path.";
    }
    return null;
  }
  if (binding.kind === "expression") {
    const expr = binding.expression.trim();
    if (!expr) return "Expression cannot be empty.";
    const unresolvedToken = /\{\{\s*([^}]+)\s*\}\}/.test(
      String(evaluateBindingPreview(binding)),
    );
    if (unresolvedToken && binding.fallback === undefined) {
      return "Expression references unresolved token(s) in sample data/state.";
    }
    return null;
  }
  return null;
}

function bindingIssues(binding: BindingDescriptor): {
  schema: string | null;
  sample: string | null;
} {
  const z = validateBindingDescriptorSchema(binding);
  if (!z.ok) return { schema: z.message, sample: null };
  return { schema: null, sample: validateBindingSample(z.data) };
}

type BindingDraftFieldsProps = {
  initialBinding: BindingDescriptor | undefined;
  node: UiNode;
  targetKey: string;
  onApplyBinding: (b: BindingDescriptor) => void;
};

/**
 * Remounted when `targetKey` or stored binding changes (`key` on parent) so
 * drafts sync from DSL without effects.
 */
function BindingDraftFields(props: BindingDraftFieldsProps) {
  const { initialBinding, node, targetKey, onApplyBinding } = props;
  const initial = initialBinding;

  const [mode, setMode] = useState<BindingMode>(() => initial?.kind ?? "query");
  const [source, setSource] = useState(
    () =>
      initial?.kind === "query"
        ? initial.source
        : Object.keys(SAMPLE_DATA_SOURCES)[0] ?? "orders",
  );
  const [path, setPath] = useState(() => (initial?.kind === "query" ? initial.path : ""));
  const [expression, setExpression] = useState(() =>
    initial?.kind === "expression" ? initial.expression : "",
  );
  const [statePath, setStatePath] = useState(() =>
    initial?.kind === "state"
      ? initial.path
      : SAMPLE_STATE_PATHS[0] ?? "",
  );
  const [staticValue, setStaticValue] = useState(() =>
    initial?.kind === "static" ? formatValueForInput(initial.value) : "",
  );

  const sourcePaths = useMemo(() => {
    const base = listDataPaths(SAMPLE_DATA_SOURCES[source]).filter(Boolean);
    const b = node.bindings?.[targetKey];
    if (b?.kind === "query" && b.source === source && b.path && !base.includes(b.path)) {
      return [...base, b.path];
    }
    return base;
  }, [source, node.bindings, targetKey]);

  const statePathOptions = useMemo(() => {
    const b = node.bindings?.[targetKey];
    const list = [...SAMPLE_STATE_PATHS];
    if (b?.kind === "state" && b.path && !list.includes(b.path)) {
      list.push(b.path);
    }
    return list;
  }, [node.bindings, targetKey]);

  const draftPreview = useMemo(() => {
    if (mode === "query" && path) {
      return evaluateBindingPreview({ kind: "query", source, path });
    }
    if (mode === "state" && statePath) {
      return evaluateBindingPreview({ kind: "state", path: statePath });
    }
    if (mode === "expression" && expression.trim()) {
      return evaluateBindingPreview({
        kind: "expression",
        expression: expression.trim(),
      });
    }
    if (mode === "static") {
      return evaluateBindingPreview({ kind: "static", value: staticValue });
    }
    return undefined;
  }, [expression, mode, path, source, statePath, staticValue]);

  const draftBinding = useMemo<BindingDescriptor | null>(() => {
    if (mode === "query" && path) return { kind: "query", source, path };
    if (mode === "state" && statePath) return { kind: "state", path: statePath };
    if (mode === "expression" && expression.trim()) {
      return { kind: "expression", expression: expression.trim() };
    }
    if (mode === "static") return { kind: "static", value: staticValue };
    return null;
  }, [expression, mode, path, source, statePath, staticValue]);

  const draftSchema = useMemo(() => {
    if (!draftBinding) return null;
    return validateBindingDescriptorSchema(draftBinding);
  }, [draftBinding]);

  const draftSampleIssue =
    draftBinding && draftSchema?.ok ? validateBindingSample(draftSchema.data) : null;

  function apply(next: BindingDescriptor) {
    const parsed = validateBindingDescriptorSchema(next);
    if (!parsed.ok) return;
    onApplyBinding(parsed.data);
  }

  const canApplyDraft = Boolean(draftBinding && draftSchema?.ok);

  return (
    <>
      <div className="grid gap-2">
        <div>
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">
            {msg("bindings.mode")}
          </label>
          <select
            className={controlClass}
            value={mode}
            onChange={(e) => setMode(e.target.value as BindingMode)}
          >
            <option value="query">{msg("bindings.modeQuery")}</option>
            <option value="state">{msg("bindings.modeState")}</option>
            <option value="expression">{msg("bindings.modeExpression")}</option>
            <option value="static">{msg("bindings.modeStatic")}</option>
          </select>
        </div>
      </div>

      {mode === "query" ? (
        <div className="grid gap-2">
          <div>
            <label className="mb-1 block text-[0.65rem] text-muted-foreground">
              {msg("bindings.dataSource")}
            </label>
            <select
              className={controlClass}
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPath("");
              }}
            >
              {Object.keys(SAMPLE_DATA_SOURCES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[0.65rem] text-muted-foreground">
              {msg("bindings.path")}
            </label>
            <select
              className={controlClass}
              value={path}
              onChange={(e) => setPath(e.target.value)}
            >
              <option value="">{msg("bindings.pathPlaceholder")}</option>
              {sourcePaths.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={!canApplyDraft}
            className={cn(
              "rounded-md border border-border px-2 py-1 text-xs hover:bg-muted",
              !canApplyDraft && "cursor-not-allowed opacity-50",
            )}
            onClick={() => {
              if (!path) return;
              apply({ kind: "query", source, path });
            }}
          >
            {msg("bindings.applyQuery")}
          </button>
        </div>
      ) : null}

      {mode === "state" ? (
        <div className="grid gap-2">
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">
            {msg("bindings.statePath")}
          </label>
          <select
            className={controlClass}
            value={statePath}
            onChange={(e) => setStatePath(e.target.value)}
          >
            {statePathOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!canApplyDraft}
            className={cn(
              "rounded-md border border-border px-2 py-1 text-xs hover:bg-muted",
              !canApplyDraft && "cursor-not-allowed opacity-50",
            )}
            onClick={() => apply({ kind: "state", path: statePath })}
          >
            {msg("bindings.applyState")}
          </button>
        </div>
      ) : null}

      {mode === "expression" ? (
        <div className="grid gap-2">
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">
            {msg("bindings.expression")}
          </label>
          <input
            className={controlClass}
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="{{filters.search}} ? 'Filtered' : 'All'"
          />
          <button
            type="button"
            disabled={!canApplyDraft}
            className={cn(
              "rounded-md border border-border px-2 py-1 text-xs hover:bg-muted",
              !canApplyDraft && "cursor-not-allowed opacity-50",
            )}
            onClick={() => {
              if (!expression.trim()) return;
              apply({ kind: "expression", expression: expression.trim() });
            }}
          >
            {msg("bindings.applyExpression")}
          </button>
        </div>
      ) : null}

      {mode === "static" ? (
        <div className="grid gap-2">
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">
            {msg("bindings.staticValue")}
          </label>
          <input
            className={controlClass}
            value={staticValue}
            onChange={(e) => setStaticValue(e.target.value)}
            placeholder={msg("bindings.staticPlaceholder")}
          />
          <button
            type="button"
            disabled={!canApplyDraft}
            className={cn(
              "rounded-md border border-border px-2 py-1 text-xs hover:bg-muted",
              !canApplyDraft && "cursor-not-allowed opacity-50",
            )}
            onClick={() => apply({ kind: "static", value: staticValue })}
          >
            {msg("bindings.applyStatic")}
          </button>
        </div>
      ) : null}

      <div className="rounded-md border border-border/70 bg-muted/20 px-2 py-1.5">
        <p className="text-[0.65rem] font-medium text-muted-foreground">
          {msg("bindings.samplePreview")}
        </p>
        <p className="mt-0.5 text-[0.7rem] leading-snug text-foreground/90">
          {draftPreview === undefined
            ? msg("bindings.previewWait")
            : formatPreview(draftPreview)}
        </p>
        {draftBinding && draftSchema && draftSchema.ok === false ? (
          <p className="mt-1 text-[0.68rem] leading-snug text-destructive">
            {msg("bindings.schemaInvalid", { detail: draftSchema.message })}
          </p>
        ) : null}
        {draftBinding && draftSchema?.ok && draftSampleIssue ? (
          <p className="mt-1 text-[0.68rem] leading-snug text-amber-700">
            {msg("bindings.sampleIssue", { detail: draftSampleIssue })}
          </p>
        ) : null}
        {draftBinding && draftSchema?.ok && !draftSampleIssue ? (
          <p className="mt-1 text-[0.68rem] leading-snug text-emerald-700">
            {msg("bindings.sampleOk")}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function DataBindingPanel(props: {
  node: UiNode;
  bindableKeys: string[];
  onApplyBindings: (next: Record<string, BindingDescriptor> | undefined) => void;
}) {
  const { node, bindableKeys, onApplyBindings } = props;
  const [targetKey, setTargetKey] = useState(bindableKeys[0] ?? "label");

  const existing = node.bindings ?? {};
  const bindingForTarget = node.bindings?.[targetKey];
  const bindingSig = useMemo(
    () => JSON.stringify(bindingForTarget ?? null),
    [bindingForTarget],
  );

  function apply(next: BindingDescriptor) {
    const parsed = validateBindingDescriptorSchema(next);
    if (!parsed.ok) return;
    const merged = { ...existing, [targetKey]: parsed.data };
    onApplyBindings(merged);
  }

  function removeBinding(key: string) {
    const next = { ...existing };
    delete next[key];
    onApplyBindings(Object.keys(next).length ? next : undefined);
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-border/70 bg-background/70 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {msg("bindings.panelTitle")}
      </p>
      <div className="grid gap-2">
        <div>
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">
            {msg("bindings.property")}
          </label>
          <select
            className={controlClass}
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
          >
            {bindableKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BindingDraftFields
        key={`${node.id}-${targetKey}-${bindingSig}`}
        initialBinding={node.bindings?.[targetKey]}
        node={node}
        targetKey={targetKey}
        onApplyBinding={apply}
      />

      {Object.keys(existing).length > 0 ? (
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-[0.65rem] font-medium text-muted-foreground">
            {msg("bindings.activeBindings")}
          </p>
          <ul className="space-y-1">
            {Object.entries(existing).map(([key, binding]) => {
              const issues = bindingIssues(binding);
              return (
                <li key={key} className="flex items-center justify-between gap-2 text-[0.7rem]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="font-medium">{key}</span>{" "}
                      {msg("bindings.kindSuffix", { kind: binding.kind })}
                    </p>
                    <p className="max-w-56 truncate text-[0.65rem] text-muted-foreground">
                      {formatPreview(evaluateBindingPreview(binding))}
                    </p>
                    {issues.schema ? (
                      <p className="text-[0.65rem] text-destructive">{issues.schema}</p>
                    ) : issues.sample ? (
                      <p className="text-[0.65rem] text-amber-700">{issues.sample}</p>
                    ) : (
                      <p className="text-[0.65rem] text-emerald-700">
                        {msg("bindings.statusOk")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded border border-border px-1.5 py-0.5 text-[0.65rem] hover:bg-muted"
                    onClick={() => removeBinding(key)}
                  >
                    {msg("bindings.remove")}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
