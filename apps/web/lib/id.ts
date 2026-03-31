/** Stable UUID v4 for DSL node ids (browser + Node). */
export function newNodeId(): string {
  return crypto.randomUUID();
}
