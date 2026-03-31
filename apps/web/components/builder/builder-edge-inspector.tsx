"use client";

import type { AiuiDocument, PrototypeEdge } from "@aiui/dsl-schema";
import { getDefinition } from "@aiui/registry";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDocumentStore } from "@/stores/document-store";
import { msg } from "@/lib/i18n/messages";
import { useMemo } from "react";

function collectNodePickerRows(
  root: import("@aiui/dsl-schema").UiNode,
): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  function walk(n: import("@aiui/dsl-schema").UiNode) {
    const title = getDefinition(n.type)?.displayName ?? n.type;
    const raw = n.props.label;
    const label =
      typeof raw === "string" && raw.trim()
        ? `${title}: ${raw.trim()}`
        : title;
    out.push({ id: n.id, label: `${label} · ${n.id.slice(0, 8)}…` });
    for (const c of n.children ?? []) walk(c);
  }
  walk(root);
  return out;
}

type BuilderEdgeInspectorProps = {
  document: AiuiDocument;
  edge: PrototypeEdge;
  onClose: () => void;
};

export function BuilderEdgeInspector(props: BuilderEdgeInspectorProps) {
  const { document, edge, onClose } = props;
  const updatePrototypeEdgeSourceNode = useDocumentStore(
    (s) => s.updatePrototypeEdgeSourceNode,
  );

  const sourceScreen = document.screens[edge.source];
  const targetScreen = document.screens[edge.target];
  const rows = useMemo(
    () =>
      sourceScreen ? collectNodePickerRows(sourceScreen.root) : [],
    [sourceScreen],
  );

  const value =
    edge.sourceNodeId === undefined ? "" : edge.sourceNodeId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>
            {msg("builder.edgeInspectorFrom")}{" "}
            <span className="font-mono text-foreground">
              {sourceScreen?.title ?? edge.source}
            </span>
          </span>
          <span>
            {msg("builder.edgeInspectorTo")}{" "}
            <span className="font-mono text-foreground">
              {targetScreen?.title ?? edge.target}
            </span>
          </span>
          <span>
            {msg("builder.edgeInspectorKind")}{" "}
            <span className="text-foreground">{edge.kind}</span>
          </span>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label htmlFor="edge-trigger-node" className="text-xs">
          {msg("builder.edgeInspectorTriggerLabel")}
        </Label>
        <select
          id="edge-trigger-node"
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            updatePrototypeEdgeSourceNode(
              edge.id,
              v === "" ? undefined : v,
            );
          }}
        >
          <option value="">{msg("builder.edgeInspectorTriggerDefault")}</option>
          {rows.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
        <p className="text-[0.65rem] leading-snug text-muted-foreground">
          {msg("builder.edgeInspectorTriggerHelp")}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClose}>
        {msg("builder.edgeInspectorDone")}
      </Button>
    </div>
  );
}
