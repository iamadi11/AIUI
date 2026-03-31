import type { Action } from "@aiui/dsl-schema";
import type { Edge, Node } from "@xyflow/react";

const START_ID = "logic-start";

function escapeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function formatActionLabel(action: Action): string {
  switch (action.type) {
    case "setState":
      return `setState → ${action.path}`;
    case "navigate":
      return `navigate → ${action.href}`;
    case "http":
      return `${action.method} ${action.url}`;
    case "sequence":
      return `sequence (${action.steps.length} steps)`;
    case "condition":
      return `if (${action.when})`;
  }
}

/**
 * Linearize actions for graph layout: expands `sequence` and `condition`
 * into rows (then/else branches get prefixed labels).
 */
export function flattenActions(actions: Action[]): { label: string; action?: Action }[] {
  const out: { label: string; action?: Action }[] = [];
  for (const a of actions) {
    if (a.type === "sequence") {
      out.push(...flattenActions(a.steps));
    } else if (a.type === "condition") {
      out.push({ label: `if (${a.when})`, action: a });
      const thenFlat = flattenActions([a.then]);
      thenFlat.forEach((row, i) => {
        out.push({
          label: i === 0 ? `then → ${row.label}` : `    ${row.label}`,
          action: row.action,
        });
      });
      if (a.else) {
        const elseFlat = flattenActions([a.else]);
        elseFlat.forEach((row, i) => {
          out.push({
            label: i === 0 ? `else → ${row.label}` : `    ${row.label}`,
            action: row.action,
          });
        });
      }
    } else {
      out.push({ label: formatActionLabel(a), action: a });
    }
  }
  return out;
}

export type LogicFlowNodeData = {
  label: string;
  /** Present on steps backed by a concrete action (for inspect / debug). */
  action?: Action;
};

/**
 * Build a read-only React Flow graph for a node's `events` map:
 * Start → each event name → flattened action chain top-to-bottom per column.
 */
export function eventsToFlowElements(
  events: Record<string, Action[]> | undefined,
): { nodes: Node<LogicFlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<LogicFlowNodeData>[] = [];
  const edges: Edge[] = [];
  const colW = 240;
  const rowH = 58;

  nodes.push({
    id: START_ID,
    type: "input",
    position: { x: 0, y: 0 },
    data: { label: "Start" },
  });

  if (!events || Object.keys(events).length === 0) {
    return { nodes, edges };
  }

  let col = 0;
  for (const [eventName, actions] of Object.entries(events)) {
    const safe = escapeSegment(eventName);
    const eid = `evt-${col}-${safe}`;
    nodes.push({
      id: eid,
      position: { x: col * colW, y: rowH },
      data: { label: eventName },
    });
    edges.push({
      id: `edge-${START_ID}-${eid}`,
      source: START_ID,
      target: eid,
    });

    const flat = flattenActions(actions);
    let prev = eid;
    const baseY = rowH * 2;
    flat.forEach((item, i) => {
      const aid = `act-${col}-${i}-${safe}`;
      nodes.push({
        id: aid,
        position: { x: col * colW, y: baseY + i * rowH },
        data: { label: item.label, action: item.action },
      });
      edges.push({
        id: `edge-${prev}-${aid}`,
        source: prev,
        target: aid,
      });
      prev = aid;
    });
    col += 1;
  }

  return { nodes, edges };
}

/** Stats for UI footers / debugging. */
export function flowGraphStats(
  events: Record<string, Action[]> | undefined,
): { eventCount: number; stepCount: number } {
  if (!events) return { eventCount: 0, stepCount: 0 };
  const names = Object.keys(events);
  let stepCount = 0;
  for (const name of names) {
    stepCount += flattenActions(events[name] ?? []).length;
  }
  return { eventCount: names.length, stepCount };
}
