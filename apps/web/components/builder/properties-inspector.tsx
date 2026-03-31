"use client";

import type { Action, UiNode } from "@aiui/dsl-schema";
import { safeParseActionsArray } from "@aiui/dsl-schema";
import {
  getDefinition,
  getInspectorFields,
  type InspectorField,
} from "@aiui/registry";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { findNodeById } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";

type PropertiesInspectorProps = {
  root: UiNode;
  selectedId: string | null;
  rootId: string;
};

function resolveProp(
  node: UiNode,
  key: string,
  defaults: Record<string, unknown>,
): unknown {
  if (key in node.props) return node.props[key];
  if (key in defaults) return defaults[key];
  return undefined;
}

function FieldEditor(props: {
  node: UiNode;
  field: InspectorField;
  defaults: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const { node, field, defaults, onChange } = props;

  if (field.kind === "text") {
    const current = resolveProp(node, field.key, defaults);
    const value = typeof current === "string" ? current : "";
    return (
      <div>
        <label
          className="mb-1 block text-xs font-medium text-muted-foreground"
          htmlFor={`prop-${node.id}-${field.key}`}
        >
          {field.label}
        </label>
        <input
          id={`prop-${node.id}-${field.key}`}
          type="text"
          className={controlClass}
          value={value}
          placeholder={field.placeholder}
          autoComplete="off"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    const current = resolveProp(node, field.key, defaults);
    const value =
      typeof current === "string" ? current : String(field.options[0]?.value ?? "");
    return (
      <div>
        <label
          className="mb-1 block text-xs font-medium text-muted-foreground"
          htmlFor={`prop-${node.id}-${field.key}`}
        >
          {field.label}
        </label>
        <select
          id={`prop-${node.id}-${field.key}`}
          className={controlClass}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const current = resolveProp(node, field.key, defaults);
  const num =
    typeof current === "number"
      ? current
      : typeof current === "string"
        ? Number(current)
        : 0;
  const safe = Number.isFinite(num) ? num : 0;

  return (
    <div>
      <label
        className="mb-1 block text-xs font-medium text-muted-foreground"
        htmlFor={`prop-${node.id}-${field.key}`}
      >
        {field.label}
      </label>
      <input
        id={`prop-${node.id}-${field.key}`}
        type="number"
        className={controlClass}
        min={field.min}
        step={field.step ?? "any"}
        value={safe}
        onChange={(e) => {
          const raw = e.target.value;
          const next = raw === "" ? 0 : Number(raw);
          onChange(field.key, Number.isFinite(next) ? next : 0);
        }}
      />
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClass =
  "min-h-[7rem] w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs leading-relaxed text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const DEFAULT_ACTIONS_JSON = `[
  {
    "type": "setState",
    "path": "count",
    "value": 0
  }
]`;

type EventBindingRow = {
  id: string;
  name: string;
  jsonText: string;
};

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}`;
}

function buildEventsRecord(
  rows: EventBindingRow[],
):
  | { ok: true; data: Record<string, Action[]> }
  | { ok: false; message: string } {
  const seen = new Set<string>();
  const out: Record<string, Action[]> = {};
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) {
      return { ok: false, message: "Each event needs a non-empty name." };
    }
    if (seen.has(name)) {
      return { ok: false, message: `Duplicate event name: ${name}` };
    }
    seen.add(name);
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.jsonText);
    } catch {
      return { ok: false, message: `Invalid JSON for "${name}".` };
    }
    const r = safeParseActionsArray(parsed);
    if (!r.success) {
      return {
        ok: false,
        message: `Invalid actions for "${name}": ${r.error.message}`,
      };
    }
    out[name] = r.data;
  }
  return { ok: true, data: out };
}

function EventsSection(props: {
  nodeId: string;
  events: UiNode["events"];
  onApply: (next: Record<string, Action[]> | undefined) => void;
}) {
  const { nodeId, events, onApply } = props;
  const serialized = useMemo(() => JSON.stringify(events ?? {}), [events]);
  const [rows, setRows] = useState<EventBindingRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    queueMicrotask(() => {
      setRows(
        Object.entries(events ?? {}).map(([name, actions]) => ({
          id: newRowId(),
          name,
          jsonText: JSON.stringify(actions, null, 2),
        })),
      );
      setFormError(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `serialized` fingerprints `events` by value
  }, [nodeId, serialized]);

  function commitFromRows(nextRows: EventBindingRow[]) {
    const built = buildEventsRecord(nextRows);
    if (!built.ok) {
      setFormError(built.message);
      return;
    }
    setFormError(null);
    const keys = Object.keys(built.data);
    onApply(keys.length ? built.data : undefined);
  }

  function handleBlur() {
    queueMicrotask(() => {
      commitFromRows(rowsRef.current);
    });
  }

  function updateRow(id: string, patch: Partial<Pick<EventBindingRow, "name" | "jsonText">>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => {
      const nextRows = [
        ...prev,
        {
          id: newRowId(),
          name: "click",
          jsonText: DEFAULT_ACTIONS_JSON,
        },
      ];
      queueMicrotask(() => {
        commitFromRows(nextRows);
      });
      return nextRows;
    });
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const nextRows = prev.filter((row) => row.id !== id);
      queueMicrotask(() => {
        commitFromRows(nextRows);
      });
      return nextRows;
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Events</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={addRow}
        >
          <Plus className="size-3.5" aria-hidden />
          Add binding
        </Button>
      </div>
      <p className="mb-3 text-[0.65rem] leading-snug text-muted-foreground">
        Map an event name to a JSON array of actions (
        <code className="rounded bg-muted px-0.5">setState</code>,{" "}
        <code className="rounded bg-muted px-0.5">navigate</code>,{" "}
        <code className="rounded bg-muted px-0.5">http</code>, …). Blur a field
        to save.
      </p>
      {formError ? (
        <p className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {formError}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No event bindings.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-border bg-muted/20 p-3"
            >
              <div className="mb-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <label
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                    htmlFor={`event-name-${row.id}`}
                  >
                    Event name
                  </label>
                  <input
                    id={`event-name-${row.id}`}
                    type="text"
                    className={controlClass}
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    onBlur={handleBlur}
                    placeholder="click"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remove binding"
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                  htmlFor={`event-actions-${row.id}`}
                >
                  Actions (JSON array)
                </label>
                <textarea
                  id={`event-actions-${row.id}`}
                  className={textareaClass}
                  spellCheck={false}
                  value={row.jsonText}
                  onChange={(e) =>
                    updateRow(row.id, { jsonText: e.target.value })
                  }
                  onBlur={handleBlur}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PropertiesInspector(props: PropertiesInspectorProps) {
  const { root, selectedId, rootId } = props;
  const updateNode = useDocumentStore((s) => s.updateNode);

  const node = selectedId ? findNodeById(root, selectedId) : null;
  const def = node ? getDefinition(node.type) : undefined;
  const fields = node ? getInspectorFields(node.type) : undefined;

  if (!selectedId) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Properties
        </p>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          Select a node in the tree or canvas to edit properties.
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Properties
        </p>
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive shadow-sm">
          Selected node is no longer in the document.
        </div>
      </div>
    );
  }

  const defaults = def?.defaultProps ?? {};
  const hasEditorFields = fields && fields.length > 0;
  const editingId = node.id;

  function applyProp(key: string, value: unknown) {
    updateNode(editingId, (n) => ({
      ...n,
      props: { ...n.props, [key]: value },
    }));
  }

  function applyEvents(next: Record<string, Action[]> | undefined) {
    updateNode(editingId, (n) => {
      if (next === undefined) {
        const copy = { ...n };
        delete copy.events;
        return copy;
      }
      return { ...n, events: next };
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Properties
      </p>
      <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
        <div className="mb-3 border-b border-border pb-2 text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{node.type}</span>
          <span className="ml-2 block truncate font-mono text-[0.65rem] text-muted-foreground/90">
            {node.id}
          </span>
          {node.id === rootId ? (
            <span className="mt-1 inline-block text-[0.65rem]">Root</span>
          ) : null}
        </div>
        {!hasEditorFields ? (
          <p className="text-sm text-muted-foreground">
            No editable properties for this component.
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field) => (
              <FieldEditor
                key={field.key}
                node={node}
                field={field}
                defaults={defaults}
                onChange={applyProp}
              />
            ))}
          </div>
        )}
        <EventsSection
          nodeId={editingId}
          events={node.events}
          onApply={applyEvents}
        />
      </div>
    </div>
  );
}
