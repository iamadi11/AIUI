"use client";

import type { Action, UiNode } from "@aiui/dsl-schema";
import {
  getDefinition,
  getInspectorFields,
  type InspectorField,
} from "@aiui/registry";
import { findNodeById } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";
import { EventBindingsPanel } from "./event-bindings-panel";

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

function resolveLayoutNumber(node: UiNode, key: string): number {
  const layout = node.layout as Record<string, unknown> | undefined;
  const raw = layout?.[key];
  if (key === "padding" || key === "margin") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const o = raw as Record<string, unknown>;
      const t = Number(o.top) || 0;
      const r = Number(o.right) || 0;
      const b = Number(o.bottom) || 0;
      const l = Number(o.left) || 0;
      return (t + r + b + l) / 4;
    }
    return 0;
  }
  if (key === "width" || key === "height") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    return 0;
  }
  return 0;
}

function applyLayoutUpdate(node: UiNode, key: string, value: unknown): UiNode {
  const prev = node.layout ? { ...node.layout } : {};
  const next = { ...prev } as Record<string, unknown>;
  if (key === "padding" || key === "margin") {
    const n = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
    if (n === 0) delete next[key];
    else next[key] = n;
    return {
      ...node,
      layout: Object.keys(next).length ? next : undefined,
    };
  }
  if (key === "width" || key === "height") {
    const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
    if (n <= 0) delete next[key];
    else next[key] = Math.max(32, Math.round(n));
    return {
      ...node,
      layout: Object.keys(next).length ? next : undefined,
    };
  }
  return node;
}

function fieldScope(field: InspectorField): "props" | "layout" {
  return field.scope ?? "props";
}

function FieldEditor(props: {
  node: UiNode;
  field: InspectorField;
  defaults: Record<string, unknown>;
  onChange: (field: InspectorField, value: unknown) => void;
}) {
  const { node, field, defaults, onChange } = props;
  const scope = fieldScope(field);

  if (field.kind === "text") {
    if (scope === "layout") {
      return null;
    }
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
          onChange={(e) => onChange(field, e.target.value)}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    if (scope === "layout") {
      return null;
    }
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
          onChange={(e) => onChange(field, e.target.value)}
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

  if (field.kind === "number" && scope === "layout") {
    const layoutVal = resolveLayoutNumber(node, field.key);
    const isIntrinsic = field.key === "width" || field.key === "height";
    const displayVal =
      isIntrinsic && layoutVal === 0 ? "" : String(layoutVal);
    return (
      <div>
        <label
          className="mb-1 block text-xs font-medium text-muted-foreground"
          htmlFor={`layout-${node.id}-${field.key}`}
        >
          {field.label}
        </label>
        <input
          id={`layout-${node.id}-${field.key}`}
          type="number"
          className={controlClass}
          min={field.min}
          step={field.step ?? "any"}
          value={displayVal}
          placeholder={isIntrinsic ? "Auto" : undefined}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(field, 0);
              return;
            }
            const next = Number(raw);
            onChange(field, Number.isFinite(next) ? next : 0);
          }}
        />
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
          onChange(field, Number.isFinite(next) ? next : 0);
        }}
      />
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

  function applyField(field: InspectorField, value: unknown) {
    const scope = fieldScope(field);
    if (scope === "layout") {
      updateNode(editingId, (n) => applyLayoutUpdate(n, field.key, value));
      return;
    }
    updateNode(editingId, (n) => ({
      ...n,
      props: { ...n.props, [field.key]: value },
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
                key={`${fieldScope(field)}-${field.kind}-${field.key}`}
                node={node}
                field={field}
                defaults={defaults}
                onChange={applyField}
              />
            ))}
          </div>
        )}
        <EventBindingsPanel
          nodeId={editingId}
          events={node.events}
          onApply={applyEvents}
        />
      </div>
    </div>
  );
}
