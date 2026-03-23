import type { DataNode } from "./types.js";
import { FieldType } from "./types.js";
import { hashString } from "./hash.js";

function flattenSorted(node: DataNode): DataNode[] {
  const out: DataNode[] = [node];
  if (node.children) {
    for (const c of node.children) {
      out.push(...flattenSorted(c));
    }
  }
  return out.sort((a, b) => a.path.join(".").localeCompare(b.path.join(".")));
}

export function generateSchemaSignature(root: DataNode): string {
  const fields = flattenSorted(root).map((n) => ({
    path: n.path.join("."),
    type: n.inferredType,
    hints: [...n.semanticHints].sort().join(","),
    card: n.cardinality,
  }));
  const payload = JSON.stringify(fields);
  return hashString(payload);
}

/** Shape-only tree for AI / caching — must not include raw values */
export function schemaTreeForAI(node: DataNode): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: node.inferredType,
    cardinality: node.cardinality,
    hints: [...node.semanticHints].sort(),
  };
  if (node.metadata.enumValues?.length) {
    base.enumSample = node.metadata.enumValues.slice(0, 10);
  }
  if (node.children?.length) {
    if (node.inferredType === FieldType.ARRAY && node.semanticHints.includes("array_of_objects")) {
      base.itemFields = Object.fromEntries(
        (node.children ?? []).map((c) => [c.path[c.path.length - 1]!, schemaTreeForAI(c)]),
      );
    } else if (node.inferredType === FieldType.OBJECT) {
      base.fields = Object.fromEntries(
        (node.children ?? []).map((c) => [c.path[c.path.length - 1]!, schemaTreeForAI(c)]),
      );
    } else {
      base.children = (node.children ?? []).map(schemaTreeForAI);
    }
  }
  return base;
}
