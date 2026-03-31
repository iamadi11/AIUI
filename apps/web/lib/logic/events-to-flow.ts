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
 * Build a read-only React Flow graph for a node's `events` map:
 * Start → each event name → chained actions left-to-right by column.
 */
export function eventsToFlowElements(
  events: Record<string, Action[]> | undefined,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const colW = 220;
  const rowH = 64;

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

    let prev = eid;
    const y = rowH * 2;
    actions.forEach((action, i) => {
      const aid = `act-${col}-${i}-${safe}`;
      nodes.push({
        id: aid,
        position: { x: col * colW, y: y + i * rowH },
        data: { label: formatActionLabel(action) },
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
