"use client";

import type { BindingDescriptor, UiNode } from "@aiui/dsl-schema";
import { useMemo, useState } from "react";
import {
  SAMPLE_DATA_SOURCES,
  SAMPLE_STATE_PATHS,
  listDataPaths,
} from "@/lib/builder/sample-data-sources";

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type BindingMode = BindingDescriptor["kind"];

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

      {Object.keys(existing).length > 0 ? (
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-[0.65rem] font-medium text-muted-foreground">Active bindings</p>
          <ul className="space-y-1">
            {Object.entries(existing).map(([key, binding]) => (
              <li key={key} className="flex items-center justify-between gap-2 text-[0.7rem]">
                <span className="truncate">
                  <span className="font-medium">{key}</span> {"->"} {binding.kind}
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
