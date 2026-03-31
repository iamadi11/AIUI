"use client";

import type { Action, BindingDescriptor, UiNode } from "@aiui/dsl-schema";
import {
  getDefinition,
  INSPECTOR_SECTION_LABELS,
  INSPECTOR_SECTION_ORDER,
  type InspectorSectionId,
  getInspectorFields,
  getCapabilities,
  type InspectorField,
} from "@aiui/registry";
import { findNodeById } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";
import { DataBindingPanel } from "./data-binding-panel";
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

type MarginSides = { top: number; right: number; bottom: number; left: number };

function readMarginSides(node: UiNode): MarginSides {
  const raw = node.layout?.margin as unknown;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const v = Math.max(0, raw);
    return { top: v, right: v, bottom: v, left: v };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      top: Math.max(0, Number(o.top) || 0),
      right: Math.max(0, Number(o.right) || 0),
      bottom: Math.max(0, Number(o.bottom) || 0),
      left: Math.max(0, Number(o.left) || 0),
    };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

function applyMarginSidesUpdate(node: UiNode, next: MarginSides): UiNode {
  const prev = node.layout ? { ...node.layout } : {};
  const out = { ...prev } as Record<string, unknown>;
  if (
    next.top === 0 &&
    next.right === 0 &&
    next.bottom === 0 &&
    next.left === 0
  ) {
    delete out.margin;
  } else {
    out.margin = next;
  }
  return {
    ...node,
    layout: Object.keys(out).length ? out : undefined,
  };
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

function inferFieldSection(
  field: InspectorField,
  fallback: InspectorSectionId,
): InspectorSectionId {
  if (fieldScope(field) === "layout") return "layout";
  return fallback;
}

function helperCopyForSection(section: InspectorSectionId): string | null {
  if (section === "content") return "Primary labels and visible text.";
  if (section === "actions")
    return "What happens when users interact with this component.";
  if (section === "layout")
    return "Spacing and sizing rules that shape this component.";
  if (section === "data")
    return "Data source and binding controls appear here.";
  if (section === "visibility")
    return "Show/hide and enable/disable rules appear here.";
  return null;
}

function hasFiniteLayoutNumber(node: UiNode, key: "width" | "height"): boolean {
  const raw = node.layout?.[key];
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0;
}

function layoutGuidance(node: UiNode): {
  level: "neutral" | "caution";
  message: string;
} {
  const fixedWidth = hasFiniteLayoutNumber(node, "width");
  const fixedHeight = hasFiniteLayoutNumber(node, "height");
  if (!fixedWidth && !fixedHeight) {
    return {
      level: "neutral",
      message:
        "Prefer content-driven sizing (leave Width/Height empty) so layouts adapt better across viewports.",
    };
  }
  if (fixedWidth && fixedHeight) {
    return {
      level: "caution",
      message:
        "Both Width and Height are fixed. This may reduce responsiveness on smaller screens.",
    };
  }
  return {
    level: "caution",
    message:
      "A fixed dimension is set. Use fixed sizing only when needed; prefer intrinsic sizing for responsive behavior.",
  };
}

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function FieldEditor(props: {
  node: UiNode;
  field: InspectorField;
  defaults: Record<string, unknown>;
  onChange: (field: InspectorField, value: unknown) => void;
}) {
  const { node, field, defaults, onChange } = props;
  const scope = fieldScope(field);

  if (field.kind === "marginSides" && scope === "layout") {
    const sides = readMarginSides(node);
    const edges: { key: keyof MarginSides; short: string }[] = [
      { key: "top", short: "T" },
      { key: "right", short: "R" },
      { key: "bottom", short: "B" },
      { key: "left", short: "L" },
    ];
    return (
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {field.label}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {edges.map(({ key: sideKey, short }) => (
            <div key={sideKey}>
              <label
                className="mb-1 block text-[0.65rem] text-muted-foreground"
                htmlFor={`layout-${node.id}-margin-${sideKey}`}
              >
                {short}
              </label>
              <input
                id={`layout-${node.id}-margin-${sideKey}`}
                type="number"
                className={controlClass}
                min={field.min}
                step={field.step ?? "any"}
                value={sides[sideKey] === 0 ? "" : String(sides[sideKey])}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === "" ? 0 : Number(raw);
                  const v = Number.isFinite(n) ? Math.max(0, n) : 0;
                  onChange(field, { ...sides, [sideKey]: v });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
  const capabilities = getCapabilities(node.type);
  const editingId = node.id;
  const inspectorOrder =
    def?.ux.inspector?.sectionOrder ?? INSPECTOR_SECTION_ORDER;
  const defaultSection = def?.ux.inspector?.defaultSection ?? "content";
  const fieldsBySection = new Map<InspectorSectionId, InspectorField[]>();
  for (const section of inspectorOrder) {
    fieldsBySection.set(section, []);
  }
  for (const field of fields ?? []) {
    const target = inferFieldSection(field, defaultSection);
    const list = fieldsBySection.get(target);
    if (list) list.push(field);
    else fieldsBySection.set(target, [field]);
  }
  const hasActions = Boolean(node.events && Object.keys(node.events).length > 0);
  const canShowActionsSection = Boolean(
    capabilities?.supportsActions || hasActions,
  );
  const hasSectionContent =
    Boolean(hasEditorFields) ||
    canShowActionsSection ||
    inspectorOrder.includes("data") ||
    inspectorOrder.includes("visibility");

  function applyField(field: InspectorField, value: unknown) {
    const scope = fieldScope(field);
    if (field.kind === "marginSides" && scope === "layout") {
      updateNode(editingId, (n) =>
        applyMarginSidesUpdate(n, value as MarginSides),
      );
      return;
    }
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

  function applyBindings(next: Record<string, BindingDescriptor> | undefined) {
    updateNode(editingId, (n) => {
      if (next === undefined) {
        const copy = { ...n };
        delete copy.bindings;
        return copy;
      }
      return { ...n, bindings: next };
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
        {!hasSectionContent ? (
          <p className="text-sm text-muted-foreground">
            No editable properties for this component.
          </p>
        ) : (
          <div className="space-y-4">
            {inspectorOrder.map((section) => {
              const sectionFields = fieldsBySection.get(section) ?? [];
              const showActions = section === "actions";
              const showDataHint = section === "data";
              const showVisibilityHint = section === "visibility";
              const helper = helperCopyForSection(section);
              const layoutHelp = section === "layout" ? layoutGuidance(node) : null;
              const hasContent =
                sectionFields.length > 0 ||
                (showActions && canShowActionsSection) ||
                showDataHint ||
                showVisibilityHint;
              if (!hasContent) return null;

              return (
                <section
                  key={section}
                  className="rounded-lg border border-border/70 bg-muted/10 p-3"
                  aria-label={INSPECTOR_SECTION_LABELS[section]}
                >
                  <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {INSPECTOR_SECTION_LABELS[section]}
                  </h3>
                  {helper ? (
                    <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground">
                      {helper}
                    </p>
                  ) : null}

                  {sectionFields.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {sectionFields.map((field) => (
                        <FieldEditor
                          key={`${section}-${fieldScope(field)}-${field.kind}-${field.key}`}
                          node={node}
                          field={field}
                          defaults={defaults}
                          onChange={applyField}
                        />
                      ))}
                    </div>
                  ) : null}

                  {section === "layout" ? (
                    <p
                      className="mt-3 rounded-md border px-2 py-1.5 text-xs leading-snug"
                      data-aiui-hardcode-guidance
                    >
                      <span
                        className={
                          layoutHelp?.level === "caution"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                        }
                      >
                        {layoutHelp?.message}
                      </span>
                    </p>
                  ) : null}

                  {showActions && canShowActionsSection ? (
                    <div className="mt-3">
                      {!capabilities?.supportsActions && !hasActions ? (
                        <p className="text-xs text-muted-foreground">
                          This component does not currently expose action triggers.
                        </p>
                      ) : null}
                      <EventBindingsPanel
                        nodeId={editingId}
                        events={node.events}
                        onApply={applyEvents}
                      />
                    </div>
                  ) : null}

                  {showDataHint && sectionFields.length === 0 ? (
                    <div className="mt-3">
                      <DataBindingPanel
                        node={node}
                        bindableKeys={
                          (fields ?? [])
                            .filter((f) => fieldScope(f) === "props")
                            .map((f) => f.key)
                            .filter((v, i, a) => a.indexOf(v) === i)
                        }
                        onApplyBindings={applyBindings}
                      />
                    </div>
                  ) : null}

                  {showVisibilityHint && sectionFields.length === 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Visibility rules will appear here in a later phase.
                    </p>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
