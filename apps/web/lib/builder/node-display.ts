import type { UiNode } from "@aiui/dsl-schema";
import { getDefinition } from "@aiui/registry";

/** Human-readable title for builder chrome (type + optional user label). */
export function formatNodeTitle(node: UiNode): string {
  const def = getDefinition(node.type);
  const typeName = def?.displayName ?? node.type;
  const label =
    typeof node.props.label === "string" && node.props.label.trim()
      ? node.props.label.trim()
      : null;
  return label ? `${typeName} (${label})` : typeName;
}
