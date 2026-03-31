"use client";

import type { UiNode } from "@aiui/dsl-schema";
import { msg } from "@/lib/i18n/messages";
import { formatNodeTitle } from "@/lib/builder/node-display";
import { cn } from "@/lib/utils";

type NodeTreeProps = {
  node: UiNode;
  depth: number;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  onRangeSelect: (id: string) => void;
  rootId: string;
  labelledById?: string;
};

export function NodeTree(props: NodeTreeProps) {
  const { node, depth, selectedIds, onSelect, onToggle, onRangeSelect, rootId } =
    props;
  const pad = depth * 12;
  const isRoot = node.id === rootId;
  const title = formatNodeTitle(node);

  const isSelected = selectedIds.includes(node.id);

  return (
    <div
      className="text-sm"
      role={depth === 0 ? "tree" : "group"}
      aria-labelledby={depth === 0 ? props.labelledById : undefined}
    >
      <button
        type="button"
        title={node.id}
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={isSelected}
        className={cn(
          "flex w-full rounded-md border border-transparent px-2 py-1.5 text-left transition-colors",
          "hover:border-border hover:bg-muted/50",
          isSelected && "border-primary/40 bg-muted/80 shadow-sm",
        )}
        style={{ paddingLeft: pad + 8 }}
        onClick={(e) => {
          if (e.shiftKey) {
            onRangeSelect(node.id);
          } else if (e.metaKey || e.ctrlKey) {
            onToggle(node.id);
          } else {
            onSelect(node.id);
          }
        }}
      >
        <span className="shrink-0 font-medium text-foreground">{title}</span>
        {isRoot ? (
          <span className="ml-2 shrink-0 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            {msg("tree.root")}
          </span>
        ) : null}
      </button>
      {node.children?.map((child) => (
        <NodeTree
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onToggle={onToggle}
          onRangeSelect={onRangeSelect}
          rootId={rootId}
        />
      ))}
    </div>
  );
}
