export function getAtPath(data: unknown, path: string[]): unknown {
  if (path.length === 0) return data;
  let cur: unknown = data;
  for (const key of path) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
