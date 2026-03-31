"use client";

import type { BindingDescriptor, UiNode } from "@aiui/dsl-schema";
import { useMemo, useState } from "react";
import {
  SAMPLE_DATA_SOURCES,
  SAMPLE_STATE,
  SAMPLE_STATE_PATHS,
  listDataPaths,
  resolveDataPath,
} from "@/lib/builder/sample-data-sources";

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
  // Lightweight expression preview:
  // replace {{path}} tokens from sample state/query roots for quick feedback.
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

export function DataBindingPanel(props: {
  node: UiNode;
  bindableKeys: string[];
  onApplyBindings: (next: Record<string, BindingDescriptor> | undefined) => void;
}) {
  const { node, bindableKeys, onApplyBindings } = props;
  const [targetKey, setTargetKey] = useState(bindableKeys[0] ?? "label");
  const [mode, setMode] = useState<BindingMode>("query");
  const [source, setSource] = useState(Object.keys(SAMPLE_DATA_SOURCES)[0] ?? "orders");
  const [path, setPath] = useState("");
  const [expression, setExpression] = useState("");
  const [statePath, setStatePath] = useState(SAMPLE_STATE_PATHS[0] ?? "");
  const [staticValue, setStaticValue] = useState("");

  const existing = node.bindings ?? {};
  const sourcePaths = useMemo(
    () => listDataPaths(SAMPLE_DATA_SOURCES[source]).filter(Boolean),
    [source],
  );
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

  function apply(next: BindingDescriptor) {
    const merged = { ...existing, [targetKey]: next };
    onApplyBindings(merged);
  }

  function removeBinding(key: string) {
    const next = { ...existing };
    delete next[key];
    onApplyBindings(Object.keys(next).length ? next : undefined);
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-border/70 bg-background/70 p-3">
      <p className="text-xs font-medium text-muted-foreground">Data bindings</p>
      <div className="grid gap-2">
        <div>
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">Property</label>
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
        <div>
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">Binding mode</label>
          <select
            className={controlClass}
            value={mode}
            onChange={(e) => setMode(e.target.value as BindingMode)}
          >
            <option value="query">Query path</option>
            <option value="state">State path</option>
            <option value="expression">Expression</option>
            <option value="static">Static value</option>
          </select>
        </div>
      </div>

      {mode === "query" ? (
        <div className="grid gap-2">
          <div>
            <label className="mb-1 block text-[0.65rem] text-muted-foreground">Data source</label>
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
            <label className="mb-1 block text-[0.65rem] text-muted-foreground">Path</label>
            <select
              className={controlClass}
              value={path}
              onChange={(e) => setPath(e.target.value)}
            >
              <option value="">Select a path...</option>
              {sourcePaths.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => {
              if (!path) return;
              apply({ kind: "query", source, path });
            }}
          >
            Apply query binding
          </button>
        </div>
      ) : null}

      {mode === "state" ? (
        <div className="grid gap-2">
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">State path</label>
          <select
            className={controlClass}
            value={statePath}
            onChange={(e) => setStatePath(e.target.value)}
          >
            {SAMPLE_STATE_PATHS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => apply({ kind: "state", path: statePath })}
          >
            Apply state binding
          </button>
        </div>
      ) : null}

      {mode === "expression" ? (
        <div className="grid gap-2">
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">Expression</label>
          <input
            className={controlClass}
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="{{filters.search}} ? 'Filtered' : 'All'"
          />
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => {
              if (!expression.trim()) return;
              apply({ kind: "expression", expression: expression.trim() });
            }}
          >
            Apply expression binding
          </button>
        </div>
      ) : null}

      {mode === "static" ? (
        <div className="grid gap-2">
          <label className="mb-1 block text-[0.65rem] text-muted-foreground">Static value</label>
          <input
            className={controlClass}
            value={staticValue}
            onChange={(e) => setStaticValue(e.target.value)}
            placeholder="Text value"
          />
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => apply({ kind: "static", value: staticValue })}
          >
            Apply static binding
          </button>
        </div>
      ) : null}

      <div className="rounded-md border border-border/70 bg-muted/20 px-2 py-1.5">
        <p className="text-[0.65rem] font-medium text-muted-foreground">Sample preview</p>
        <p className="mt-0.5 text-[0.7rem] leading-snug text-foreground/90">
          {draftPreview === undefined ? "Select a binding path/value to preview." : formatPreview(draftPreview)}
        </p>
      </div>

      {Object.keys(existing).length > 0 ? (
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-[0.65rem] font-medium text-muted-foreground">Active bindings</p>
          <ul className="space-y-1">
            {Object.entries(existing).map(([key, binding]) => (
              <li key={key} className="flex items-center justify-between gap-2 text-[0.7rem]">
                <span className="truncate">
                  <span className="font-medium">{key}</span> {"->"} {binding.kind}
                </span>
                <span className="max-w-36 truncate text-[0.65rem] text-muted-foreground">
                  {formatPreview(evaluateBindingPreview(binding))}
                </span>
                <button
                  type="button"
                  className="rounded border border-border px-1.5 py-0.5 text-[0.65rem] hover:bg-muted"
                  onClick={() => removeBinding(key)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
