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
import { msg } from "@/lib/i18n/messages";
import { findNodeById } from "@/lib/document/tree";
import { useDocumentStore } from "@/stores/document-store";
import { DataBindingPanel } from "./data-binding-panel";
import { EventBindingsPanel } from "./event-bindings-panel";
import {
  fieldScope,
  RegistryFieldEditor,
  type MarginSides,
} from "./property-editor-primitives";

type PropertiesInspectorProps = {
  root: UiNode;
  selectedId: string | null;
  rootId: string;
};

type VisibilityRules = {
  visibleWhen?: string;
  interactiveWhen?: string;
};

const RULES_PROP_KEY = "__uiRules";

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

function inferFieldSection(
  field: InspectorField,
  fallback: InspectorSectionId,
): InspectorSectionId {
  if (fieldScope(field) === "layout") return "layout";
  return fallback;
}

function helperCopyForSection(section: InspectorSectionId): string | null {
  if (section === "content") return msg("inspector.contentHelper");
  if (section === "actions") return msg("inspector.actionsHelper");
  if (section === "layout") return msg("inspector.layoutHelper");
  if (section === "data") return msg("inspector.dataHelper");
  if (section === "visibility") return msg("inspector.visibilityHelper");
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
          {msg("inspector.properties")}
        </p>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          {msg("inspector.selectNode")}
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {msg("inspector.properties")}
        </p>
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive shadow-sm">
          {msg("inspector.nodeMissing")}
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
  const nodeRules = (node.props[RULES_PROP_KEY] as VisibilityRules | undefined) ?? {};

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

  function applyVisibilityRules(next: VisibilityRules | undefined) {
    updateNode(editingId, (n) => {
      const props = { ...n.props } as Record<string, unknown>;
      if (
        !next ||
        (next.visibleWhen === undefined && next.interactiveWhen === undefined)
      ) {
        delete props[RULES_PROP_KEY];
      } else {
        props[RULES_PROP_KEY] = next;
      }
      return { ...n, props };
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {msg("inspector.properties")}
      </p>
      <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
        <div className="mb-3 border-b border-border pb-2 text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{node.type}</span>
          <span className="ml-2 block truncate font-mono text-[0.65rem] text-muted-foreground/90">
            {node.id}
          </span>
          {node.id === rootId ? (
            <span className="mt-1 inline-block text-[0.65rem]">{msg("inspector.root")}</span>
          ) : null}
        </div>
        {!hasSectionContent ? (
          <p className="text-sm text-muted-foreground">
            {msg("inspector.noEditableProps")}
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
                        <RegistryFieldEditor
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
                          {msg("inspector.noActionTriggers")}
                        </p>
                      ) : null}
                      <EventBindingsPanel
                        nodeId={editingId}
                        root={root}
                        events={node.events}
                        onApply={applyEvents}
                        interactionPresets={capabilities?.interactionPresets}
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

                  {showVisibilityHint ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label
                          className="mb-1 block text-[0.65rem] font-medium text-muted-foreground"
                          htmlFor={`visible-rule-${editingId}`}
                        >
                          {msg("inspector.visibleWhen")}
                        </label>
                        <input
                          id={`visible-rule-${editingId}`}
                          type="text"
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={nodeRules.visibleWhen ?? ""}
                          placeholder={msg("inspector.visibleWhenPlaceholder")}
                          onChange={(e) =>
                            applyVisibilityRules({
                              visibleWhen: e.target.value.trim() || undefined,
                              interactiveWhen: nodeRules.interactiveWhen,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-[0.65rem] font-medium text-muted-foreground"
                          htmlFor={`interactive-rule-${editingId}`}
                        >
                          {msg("inspector.interactiveWhen")}
                        </label>
                        <input
                          id={`interactive-rule-${editingId}`}
                          type="text"
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={nodeRules.interactiveWhen ?? ""}
                          placeholder={msg("inspector.interactiveWhenPlaceholder")}
                          onChange={(e) =>
                            applyVisibilityRules({
                              visibleWhen: nodeRules.visibleWhen,
                              interactiveWhen:
                                e.target.value.trim() || undefined,
                            })
                          }
                        />
                      </div>
                      <p className="text-[0.65rem] leading-snug text-muted-foreground">
                        {msg("inspector.visibilityRulesHelp")}
                      </p>
                    </div>
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
