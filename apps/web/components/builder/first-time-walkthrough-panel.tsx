"use client";

import type { AiuiDocument, UiNode } from "@aiui/dsl-schema";
import { CheckCircle2, Circle, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type WalkthroughStep = {
  id: string;
  label: string;
  done: boolean;
  hint: string;
};

type FrictionNote = {
  id: string;
  text: string;
  createdAt: string;
};

const STORAGE_KEY = "aiui:first-time-walkthrough-notes:v1";

function countNodes(root: UiNode): number {
  let total = 0;
  function walk(node: UiNode) {
    total += 1;
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return total;
}

function listUniqueNodeTypes(root: UiNode): Set<string> {
  const types = new Set<string>();
  function walk(node: UiNode) {
    types.add(node.type);
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return types;
}

function hasLabeledNode(root: UiNode): boolean {
  let found = false;
  function walk(node: UiNode) {
    if (found) return;
    const label = node.props?.label;
    if (typeof label === "string" && label.trim().length > 0) {
      found = true;
      return;
    }
    for (const child of node.children ?? []) walk(child);
  }
  walk(root);
  return found;
}

export function FirstTimeWalkthroughPanel(props: {
  document: AiuiDocument;
  selectedCount: number;
}) {
  const { document, selectedCount } = props;
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<FrictionNote[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as FrictionNote[];
      if (Array.isArray(parsed)) setNotes(parsed);
    } catch {
      // Ignore malformed persisted notes.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const totalNodes = useMemo(() => countNodes(document.root), [document.root]);
  const nodeTypes = useMemo(() => listUniqueNodeTypes(document.root), [document.root]);
  const hasEvents = useMemo(() => {
    let found = false;
    function walk(node: UiNode) {
      if (found) return;
      if (node.events && Object.keys(node.events).length > 0) {
        found = true;
        return;
      }
      for (const child of node.children ?? []) walk(child);
    }
    walk(document.root);
    return found;
  }, [document.root]);

  const steps: WalkthroughStep[] = useMemo(
    () => [
      {
        id: "add",
        label: "Add at least 3 layers",
        done: totalNodes >= 3,
        hint: "Use Components drag-drop or template buttons.",
      },
      {
        id: "mix",
        label: "Use both Box and Stack",
        done: nodeTypes.has("Box") && nodeTypes.has("Stack"),
        hint: "A mixed layout verifies beginner discovery in the palette.",
      },
      {
        id: "label",
        label: "Rename one layer",
        done: hasLabeledNode(document.root),
        hint: "Double-click a canvas layer label to rename.",
      },
      {
        id: "select",
        label: "Multi-select at least 2 layers",
        done: selectedCount >= 2,
        hint: "Use Cmd/Ctrl+click in canvas or tree.",
      },
      {
        id: "action",
        label: "Configure one action/event",
        done: hasEvents,
        hint: "Open a layer and add an event in Actions section.",
      },
    ],
    [document.root, hasEvents, nodeTypes, selectedCount, totalNodes],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const complete = doneCount === steps.length;

  function addNote() {
    const text = draft.trim();
    if (!text) return;
    const note: FrictionNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setDraft("");
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          First-time walkthrough
        </p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
          {doneCount}/{steps.length}
        </span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Run this checklist with a first-time builder flow and log friction points
        as they happen.
      </p>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="rounded-md border border-border/70 bg-muted/10 px-2.5 py-2"
          >
            <div className="flex items-start gap-2">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-[0.7rem] leading-snug text-muted-foreground">{step.hint}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-md border border-border/70 bg-muted/10 px-2.5 py-2 text-xs">
        {complete ? (
          <p className="flex items-center gap-1.5 text-emerald-700">
            <ClipboardCheck className="size-3.5" aria-hidden />
            Walkthrough complete. Review the friction notes before closing.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Complete all steps, then verify friction notes capture unclear copy,
            hidden controls, and surprising behavior.
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Friction notes
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={draft}
            placeholder="Example: Could not find where to add event actions."
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNote();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={addNote}
          >
            <Plus className="size-3.5" aria-hidden />
            Add
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No friction notes yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border/70 bg-background/80 px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-xs leading-relaxed text-foreground">{note.text}</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remove note"
                  onClick={() => removeNote(note.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
