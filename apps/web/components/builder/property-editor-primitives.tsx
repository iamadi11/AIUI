"use client";

import type { UiNode } from "@aiui/dsl-schema";
import type { InspectorField } from "@aiui/registry";

export type MarginSides = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const editorControlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function fieldScope(field: InspectorField): "props" | "layout" {
  return field.scope ?? "props";
}

export function resolveProp(
  node: UiNode,
  key: string,
  defaults: Record<string, unknown>,
): unknown {
  if (key in node.props) return node.props[key];
  if (key in defaults) return defaults[key];
  return undefined;
}

export function resolveLayoutNumber(node: UiNode, key: string): number {
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

export function readMarginSides(node: UiNode): MarginSides {
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

export function RegistryFieldEditor(props: {
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
        <p className="mb-2 text-xs font-medium text-muted-foreground">{field.label}</p>
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
                className={editorControlClass}
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
    if (scope === "layout") return null;
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
          className={editorControlClass}
          value={value}
          placeholder={field.placeholder}
          autoComplete="off"
          onChange={(e) => onChange(field, e.target.value)}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    if (scope === "layout") return null;
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
          className={editorControlClass}
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
    const displayVal = isIntrinsic && layoutVal === 0 ? "" : String(layoutVal);
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
          className={editorControlClass}
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
        className={editorControlClass}
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
