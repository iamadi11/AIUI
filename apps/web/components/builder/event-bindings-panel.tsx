"use client";

import type { Action, UiNode } from "@aiui/dsl-schema";
import { safeParseActionsArray } from "@aiui/dsl-schema";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  COMMON_EVENT_NAMES,
  defaultBranchAction,
  defaultConditionAction,
  defaultSimpleActions,
  formatHttpBodyInput,
  formatValueForInput,
  isBranchAction,
  isSimpleActionsList,
  parseHttpBodyInput,
  parseValueInput,
} from "@/lib/builder/event-actions";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClass =
  "min-h-[6rem] w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs leading-relaxed text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type EditorMode = "simple" | "advanced";

type EventBindingRow = {
  id: string;
  name: string;
  namePreset: (typeof COMMON_EVENT_NAMES)[number] | "custom";
  mode: EditorMode;
  simpleActions: Action[];
  jsonText: string;
};

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}`;
}

function rowFromEvents(name: string, actions: Action[]): EventBindingRow {
  const preset = (COMMON_EVENT_NAMES as readonly string[]).includes(name)
    ? (name as (typeof COMMON_EVENT_NAMES)[number])
    : "custom";
  const simple = isSimpleActionsList(actions);
  return {
    id: newRowId(),
    name,
    namePreset: preset,
    mode: simple ? "simple" : "advanced",
    simpleActions: simple ? [...actions] : defaultSimpleActions(),
    jsonText: JSON.stringify(actions, null, 2),
  };
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
    let actions: Action[];
    if (row.mode === "simple") {
      if (!isSimpleActionsList(row.simpleActions)) {
        return {
          ok: false,
          message: `Invalid actions for "${name}".`,
        };
      }
      actions = row.simpleActions;
    } else {
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
      actions = r.data;
    }
    out[name] = actions;
  }
  return { ok: true, data: out };
}

function actionSummary(actions: Action[]): string {
  if (actions.length === 0) return "No steps";
  const parts = actions.map((a) => {
    if (a.type === "setState") return "State";
    if (a.type === "navigate") return "Go to URL";
    if (a.type === "http") return `${a.method} request`;
    if (a.type === "condition") return "If";
    return a.type;
  });
  return parts.join(" → ");
}

/** Inline editor for a single branch action (nested under conditions). */
function BranchActionFields(props: {
  idPrefix: string;
  branch: Action;
  onChange: (a: Action) => void;
  onBlurCommit: () => void;
}) {
  const { idPrefix, branch, onChange, onBlurCommit } = props;
  if (!isBranchAction(branch)) return null;

  const typeSelect = (
    <div>
      <label
        className="mb-0.5 block text-[0.65rem] text-muted-foreground"
        htmlFor={`${idPrefix}-type`}
      >
        Step type
      </label>
      <select
        id={`${idPrefix}-type`}
        className={controlClass}
        value={branch.type}
        onChange={(e) => {
          const t = e.target.value;
          if (t === "setState" || t === "navigate" || t === "http") {
            onChange(defaultBranchAction(t));
          }
        }}
        onBlur={onBlurCommit}
      >
        <option value="setState">Update state</option>
        <option value="navigate">Open URL</option>
        <option value="http">HTTP</option>
      </select>
    </div>
  );

  if (branch.type === "setState") {
    return (
      <div className="space-y-2">
        {typeSelect}
        <div>
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`${idPrefix}-path`}
          >
            State path
          </label>
          <input
            id={`${idPrefix}-path`}
            type="text"
            className={controlClass}
            value={branch.path}
            onChange={(e) =>
              onChange({ ...branch, path: e.target.value })
            }
            onBlur={onBlurCommit}
            placeholder="count"
            autoComplete="off"
          />
        </div>
        <div>
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`${idPrefix}-val`}
          >
            Value (JSON or text)
          </label>
          <textarea
            id={`${idPrefix}-val`}
            className={textareaClass}
            rows={2}
            spellCheck={false}
            value={formatValueForInput(branch.value)}
            onChange={(e) =>
              onChange({
                ...branch,
                value: parseValueInput(e.target.value),
              })
            }
            onBlur={onBlurCommit}
          />
        </div>
      </div>
    );
  }

  if (branch.type === "navigate") {
    return (
      <div className="space-y-2">
        {typeSelect}
        <div>
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`${idPrefix}-href`}
          >
            Link
          </label>
          <input
            id={`${idPrefix}-href`}
            type="url"
            className={controlClass}
            value={branch.href}
            onChange={(e) =>
              onChange({ ...branch, href: e.target.value })
            }
            onBlur={onBlurCommit}
            placeholder="https://…"
            autoComplete="off"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {typeSelect}
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`${idPrefix}-m`}
          >
            Method
          </label>
          <select
            id={`${idPrefix}-m`}
            className={controlClass}
            value={branch.method}
            onChange={(e) =>
              onChange({
                ...branch,
                method: e.target.value as "GET" | "POST",
              })
            }
            onBlur={onBlurCommit}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`${idPrefix}-url`}
          >
            URL
          </label>
          <input
            id={`${idPrefix}-url`}
            type="url"
            className={controlClass}
            value={branch.url}
            onChange={(e) =>
              onChange({ ...branch, url: e.target.value })
            }
            onBlur={onBlurCommit}
            placeholder="https://…"
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`${idPrefix}-body`}
          >
            Body (optional, JSON)
          </label>
          <textarea
            id={`${idPrefix}-body`}
            className={textareaClass}
            rows={2}
            spellCheck={false}
            value={formatHttpBodyInput(branch.body)}
            onChange={(e) => {
              const body = parseHttpBodyInput(e.target.value);
              onChange({
                ...branch,
                body: body === undefined ? undefined : body,
              });
            }}
            onBlur={onBlurCommit}
            placeholder='{"key":"value"}'
          />
        </div>
      </div>
    </div>
  );
}

function ConditionStepRow(props: {
  action: Extract<Action, { type: "condition" }>;
  index: number;
  onChange: (next: Action) => void;
  onRemove: () => void;
  onBlurCommit: () => void;
  canRemove: boolean;
}) {
  const { action, index, onChange, onRemove, onBlurCommit, canRemove } = props;
  const hasElse = action.else !== undefined;

  return (
    <div className="rounded-md border border-border/80 bg-background/60 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          If condition
        </span>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            title="Remove step"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        <div>
          <label
            className="mb-0.5 block text-[0.65rem] text-muted-foreground"
            htmlFor={`cond-when-${index}`}
          >
            When (expression)
          </label>
          <input
            id={`cond-when-${index}`}
            type="text"
            className={controlClass}
            value={action.when}
            onChange={(e) =>
              onChange({ ...action, when: e.target.value })
            }
            onBlur={onBlurCommit}
            placeholder="count > 0"
            autoComplete="off"
          />
          <p className="mt-1 text-[0.6rem] leading-snug text-muted-foreground">
            Comparisons or {"{{ }}"} paths — same rules as the expression engine.
          </p>
        </div>
        <div>
          <p className="mb-1 text-[0.65rem] font-medium text-muted-foreground">
            Then
          </p>
          <BranchActionFields
            idPrefix={`cond-then-${index}`}
            branch={action.then}
            onChange={(then) => onChange({ ...action, then })}
            onBlurCommit={onBlurCommit}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[0.65rem] text-foreground">
          <input
            type="checkbox"
            className="rounded border-input"
            checked={hasElse}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({
                  ...action,
                  else: defaultBranchAction("setState"),
                });
              } else {
                onChange({
                  type: "condition",
                  when: action.when,
                  then: action.then,
                });
              }
            }}
          />
          Else branch
        </label>
        {hasElse && action.else ? (
          <div>
            <p className="mb-1 text-[0.65rem] font-medium text-muted-foreground">
              Else
            </p>
            <BranchActionFields
              idPrefix={`cond-else-${index}`}
              branch={action.else}
              onChange={(elseAction) =>
                onChange({ ...action, else: elseAction })
              }
              onBlurCommit={onBlurCommit}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SimpleActionRow(props: {
  action: Action;
  index: number;
  onChange: (next: Action) => void;
  onRemove: () => void;
  onBlurCommit: () => void;
  canRemove: boolean;
}) {
  const { action, index, onChange, onRemove, onBlurCommit, canRemove } = props;

  if (action.type === "condition") {
    return (
      <ConditionStepRow
        action={action}
        index={index}
        onChange={onChange}
        onRemove={onRemove}
        onBlurCommit={onBlurCommit}
        canRemove={canRemove}
      />
    );
  }

  if (action.type === "setState") {
    return (
      <div className="rounded-md border border-border/80 bg-background/60 p-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Update state
          </span>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              title="Remove step"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
        <div className="space-y-2">
          <div>
            <label
              className="mb-0.5 block text-[0.65rem] text-muted-foreground"
              htmlFor={`st-path-${index}`}
            >
              State path
            </label>
            <input
              id={`st-path-${index}`}
              type="text"
              className={controlClass}
              value={action.path}
              onChange={(e) =>
                onChange({
                  ...action,
                  path: e.target.value,
                })
              }
              onBlur={onBlurCommit}
              placeholder="count"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              className="mb-0.5 block text-[0.65rem] text-muted-foreground"
              htmlFor={`st-val-${index}`}
            >
              Value (JSON or text)
            </label>
            <textarea
              id={`st-val-${index}`}
              className={textareaClass}
              rows={2}
              spellCheck={false}
              value={formatValueForInput(action.value)}
              onChange={(e) =>
                onChange({
                  ...action,
                  value: parseValueInput(e.target.value),
                })
              }
              onBlur={onBlurCommit}
            />
          </div>
        </div>
      </div>
    );
  }

  if (action.type === "navigate") {
    return (
      <div className="rounded-md border border-border/80 bg-background/60 p-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Open URL
          </span>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              title="Remove step"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
        <label
          className="mb-0.5 block text-[0.65rem] text-muted-foreground"
          htmlFor={`nav-${index}`}
        >
          Link
        </label>
        <input
          id={`nav-${index}`}
          type="url"
          className={controlClass}
          value={action.href}
          onChange={(e) =>
            onChange({ ...action, href: e.target.value })
          }
          onBlur={onBlurCommit}
          placeholder="https://…"
          autoComplete="off"
        />
      </div>
    );
  }

  if (action.type === "http") {
    return (
      <div className="rounded-md border border-border/80 bg-background/60 p-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            HTTP
          </span>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              title="Remove step"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label
              className="mb-0.5 block text-[0.65rem] text-muted-foreground"
              htmlFor={`http-m-${index}`}
            >
              Method
            </label>
            <select
              id={`http-m-${index}`}
              className={controlClass}
              value={action.method}
              onChange={(e) =>
                onChange({
                  ...action,
                  method: e.target.value as "GET" | "POST",
                })
              }
              onBlur={onBlurCommit}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label
              className="mb-0.5 block text-[0.65rem] text-muted-foreground"
              htmlFor={`http-u-${index}`}
            >
              URL
            </label>
            <input
              id={`http-u-${index}`}
              type="url"
              className={controlClass}
              value={action.url}
              onChange={(e) =>
                onChange({ ...action, url: e.target.value })
              }
              onBlur={onBlurCommit}
              placeholder="https://api.example.com/…"
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              className="mb-0.5 block text-[0.65rem] text-muted-foreground"
              htmlFor={`http-body-${index}`}
            >
              Body (optional, JSON)
            </label>
            <textarea
              id={`http-body-${index}`}
              className={textareaClass}
              rows={2}
              spellCheck={false}
              value={formatHttpBodyInput(action.body)}
              onChange={(e) => {
                const body = parseHttpBodyInput(e.target.value);
                onChange({
                  ...action,
                  body: body === undefined ? undefined : body,
                });
              }}
              onBlur={onBlurCommit}
              placeholder='{"key":"value"}'
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function EventBindingsPanel(props: {
  nodeId: string;
  events: UiNode["events"];
  onApply: (next: Record<string, Action[]> | undefined) => void;
}) {
  const { nodeId, events, onApply } = props;
  const serialized = useMemo(() => JSON.stringify(events ?? {}), [events]);
  const [rows, setRows] = useState<EventBindingRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const rowsRef = useRef(rows);
  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    queueMicrotask(() => {
      setRows(
        Object.entries(events ?? {}).map(([name, actions]) =>
          rowFromEvents(name, actions),
        ),
      );
      setFormError(null);
      setExpanded({});
    });
  }, [nodeId, serialized, events]);

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

  function updateRow(id: string, patch: Partial<EventBindingRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => {
      const nextRow: EventBindingRow = {
        id: newRowId(),
        name: "click",
        namePreset: "click",
        mode: "simple",
        simpleActions: defaultSimpleActions(),
        jsonText: JSON.stringify(defaultSimpleActions(), null, 2),
      };
      const nextRows = [...prev, nextRow];
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

  function setNamePreset(row: EventBindingRow, preset: EventBindingRow["namePreset"]) {
    setRows((prev): EventBindingRow[] => {
      const mapped: EventBindingRow[] = prev.map((r) => {
        if (r.id !== row.id) return r;
        if (preset === "custom") return { ...r, namePreset: "custom" };
        return { ...r, namePreset: preset, name: preset };
      });
      queueMicrotask(() => commitFromRows(mapped));
      return mapped;
    });
  }

  function toggleMode(row: EventBindingRow) {
    if (row.mode === "simple") {
      setRows((prev) => {
        const mapped = prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                mode: "advanced" as const,
                jsonText: JSON.stringify(r.simpleActions, null, 2),
              }
            : r,
        );
        queueMicrotask(() => commitFromRows(mapped));
        return mapped;
      });
      setFormError(null);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.jsonText);
    } catch {
      setFormError("Fix JSON before switching to the visual editor.");
      return;
    }
    const parsedList = safeParseActionsArray(parsed);
    if (!parsedList.success) {
      setFormError(parsedList.error.message);
      return;
    }
    if (!isSimpleActionsList(parsedList.data)) {
      setFormError(
        "Visual editor supports branch actions and one-level If (then/else). For sequence or nested conditions, use Advanced JSON.",
      );
      return;
    }
    setFormError(null);
    const targetId = row.id;
    const simpleList = parsedList.data;
    setRows((prev) => {
      const mapped = prev.map((binding) =>
        binding.id === targetId
          ? { ...binding, mode: "simple" as const, simpleActions: simpleList }
          : binding,
      );
      queueMicrotask(() => commitFromRows(mapped));
      return mapped;
    });
  }

  function updateSimpleAction(
    rowId: string,
    index: number,
    next: Action,
  ) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const copy = [...row.simpleActions];
        copy[index] = next;
        return { ...row, simpleActions: copy };
      }),
    );
  }

  function addVisualStep(
    rowId: string,
    type: "setState" | "navigate" | "http" | "condition",
  ) {
    setRows((prev) => {
      const mapped = prev.map((row) => {
        if (row.id !== rowId) return row;
        const next: Action =
          type === "condition"
            ? defaultConditionAction()
            : defaultBranchAction(type);
        return { ...row, simpleActions: [...row.simpleActions, next] };
      });
      queueMicrotask(() => commitFromRows(mapped));
      return mapped;
    });
  }

  function removeSimpleAction(rowId: string, index: number) {
    setRows((prev) => {
      const mapped = prev.map((row) => {
        if (row.id !== rowId) return row;
        const copy = row.simpleActions.filter((_, i) => i !== index);
        return {
          ...row,
          simpleActions: copy.length ? copy : defaultSimpleActions(),
        };
      });
      queueMicrotask(() => commitFromRows(mapped));
      return mapped;
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
          Add event
        </Button>
      </div>
      <p className="mb-3 text-[0.65rem] leading-snug text-muted-foreground">
        Add steps: state, URL, HTTP, or a one-level If (then/else). Use{" "}
        <span className="font-medium text-foreground/90">Advanced JSON</span>{" "}
        for <code className="rounded bg-muted px-0.5">sequence</code> or nested
        logic.
      </p>
      {formError ? (
        <p className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {formError}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const open = expanded[row.id] ?? true;
            const preview =
              row.mode === "simple"
                ? actionSummary(row.simpleActions)
                : "Advanced JSON";
            return (
              <li
                key={row.id}
                className="overflow-hidden rounded-lg border border-border bg-muted/15"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 border-b border-border/60 bg-muted/25 px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/40"
                  onClick={() =>
                    setExpanded((e) => ({
                      ...e,
                      [row.id]: !open,
                    }))
                  }
                >
                  {open ? (
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-medium text-foreground">
                    {row.name.trim() || "—"}
                  </span>
                  <span className="truncate text-muted-foreground">
                    · {preview}
                  </span>
                </button>
                {open ? (
                  <div className="space-y-3 p-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-32 flex-1">
                        <label
                          className="mb-1 block text-[0.65rem] font-medium text-muted-foreground"
                          htmlFor={`ev-preset-${row.id}`}
                        >
                          When
                        </label>
                        <select
                          id={`ev-preset-${row.id}`}
                          className={controlClass}
                          value={row.namePreset}
                          onChange={(e) =>
                            setNamePreset(
                              row,
                              e.target.value as EventBindingRow["namePreset"],
                            )
                          }
                          onBlur={handleBlur}
                        >
                          {COMMON_EVENT_NAMES.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                          <option value="custom">Custom…</option>
                        </select>
                      </div>
                      {row.namePreset === "custom" ? (
                        <div className="min-w-32 flex-1">
                          <label
                            className="mb-1 block text-[0.65rem] font-medium text-muted-foreground"
                            htmlFor={`ev-name-${row.id}`}
                          >
                            Custom name
                          </label>
                          <input
                            id={`ev-name-${row.id}`}
                            type="text"
                            className={controlClass}
                            value={row.name}
                            onChange={(e) =>
                              updateRow(row.id, { name: e.target.value })
                            }
                            onBlur={handleBlur}
                            placeholder="myEvent"
                            autoComplete="off"
                          />
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        title="Remove event"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.65rem] font-medium text-muted-foreground">
                        Editor
                      </span>
                      <button
                        type="button"
                        className={cn(
                          "rounded-md px-2 py-1 text-[0.65rem] font-medium transition-colors",
                          row.mode === "simple"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                        onClick={() => row.mode !== "simple" && toggleMode(row)}
                      >
                        Visual steps
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded-md px-2 py-1 text-[0.65rem] font-medium transition-colors",
                          row.mode === "advanced"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                        onClick={() => row.mode !== "advanced" && toggleMode(row)}
                      >
                        Advanced JSON
                      </button>
                    </div>

                    {row.mode === "simple" ? (
                      <div className="space-y-2">
                        {row.simpleActions.map((action, i) => (
                          <SimpleActionRow
                            key={`${row.id}-a-${i}`}
                            action={action}
                            index={i}
                            canRemove={row.simpleActions.length > 1}
                            onChange={(next) =>
                              updateSimpleAction(row.id, i, next)
                            }
                            onRemove={() => removeSimpleAction(row.id, i)}
                            onBlurCommit={handleBlur}
                          />
                        ))}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[0.65rem]"
                            onClick={() => addVisualStep(row.id, "setState")}
                          >
                            + State
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[0.65rem]"
                            onClick={() =>
                              addVisualStep(row.id, "navigate")
                            }
                          >
                            + URL
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[0.65rem]"
                            onClick={() => addVisualStep(row.id, "http")}
                          >
                            + HTTP
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[0.65rem]"
                            onClick={() =>
                              addVisualStep(row.id, "condition")
                            }
                          >
                            + If
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label
                          className="mb-1 block text-[0.65rem] font-medium text-muted-foreground"
                          htmlFor={`ev-json-${row.id}`}
                        >
                          Actions (JSON array)
                        </label>
                        <textarea
                          id={`ev-json-${row.id}`}
                          className={textareaClass}
                          spellCheck={false}
                          value={row.jsonText}
                          onChange={(e) =>
                            updateRow(row.id, { jsonText: e.target.value })
                          }
                          onBlur={handleBlur}
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
