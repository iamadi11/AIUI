"use client";

import { useDocumentStore } from "@/stores/document-store";
import {
  formatValueForInput,
  parseValueInput,
} from "@/lib/builder/event-actions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const controlClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type StateRow = { id: string; key: string; valueText: string };

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `st-${Math.random().toString(36).slice(2)}`;
}

function stateToRows(state: Record<string, unknown> | undefined): StateRow[] {
  if (!state || Object.keys(state).length === 0) {
    return [{ id: newRowId(), key: "", valueText: "" }];
  }
  return Object.entries(state).map(([key, value]) => ({
    id: newRowId(),
    key,
    valueText: formatValueForInput(value),
  }));
}

function rowsToState(rows: StateRow[]): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    const k = r.key.trim();
    if (!k) continue;
    out[k] = parseValueInput(r.valueText);
  }
  return Object.keys(out).length ? out : undefined;
}

export function DocumentStatePanel() {
  const document = useDocumentStore((s) => s.document);
  const setDocumentState = useDocumentStore((s) => s.setDocumentState);
  const fingerprint = useMemo(
    () => JSON.stringify(document.state ?? {}),
    [document.state],
  );
  const [rows, setRows] = useState<StateRow[]>([]);
  const rowsRef = useRef(rows);
  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    queueMicrotask(() => {
      setRows(stateToRows(document.state));
    });
  }, [fingerprint]);

  function commit() {
    setDocumentState(rowsToState(rowsRef.current));
  }

  function handleBlur() {
    queueMicrotask(commit);
  }

  function updateRow(id: string, patch: Partial<Pick<StateRow, "key" | "valueText">>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => {
      const next = [...prev, { id: newRowId(), key: "", valueText: "" }];
      queueMicrotask(() => setDocumentState(rowsToState(next)));
      return next;
    });
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      const normalized = next.length ? next : [{ id: newRowId(), key: "", valueText: "" }];
      queueMicrotask(() => setDocumentState(rowsToState(normalized)));
      return normalized;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Initial state
      </p>
      <p className="mb-3 text-[0.65rem] leading-snug text-muted-foreground">
        Default values for logic and {"{{ }}"} expressions. Keys become state
        paths; values accept JSON (numbers, booleans, strings, objects). Blur a
        field to save.
      </p>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1 sm:max-w-[40%]">
              <label
                className="mb-0.5 block text-[0.65rem] text-muted-foreground"
                htmlFor={`st-key-${row.id}`}
              >
                Key
              </label>
              <input
                id={`st-key-${row.id}`}
                type="text"
                className={controlClass}
                value={row.key}
                onChange={(e) => updateRow(row.id, { key: e.target.value })}
                onBlur={handleBlur}
                placeholder="count"
                autoComplete="off"
              />
            </div>
            <div className="min-w-0 flex-[2]">
              <label
                className="mb-0.5 block text-[0.65rem] text-muted-foreground"
                htmlFor={`st-val-${row.id}`}
              >
                Value
              </label>
              <input
                id={`st-val-${row.id}`}
                type="text"
                className={controlClass}
                value={row.valueText}
                onChange={(e) =>
                  updateRow(row.id, { valueText: e.target.value })
                }
                onBlur={handleBlur}
                placeholder='e.g. 0, true, "hello"'
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-5 size-8 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remove row"
              onClick={() => removeRow(row.id)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 h-7 gap-1 text-xs"
        onClick={addRow}
      >
        <Plus className="size-3.5" aria-hidden />
        Add field
      </Button>
    </div>
  );
}
