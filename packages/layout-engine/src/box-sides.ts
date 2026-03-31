export type BoxSides = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type ParseBoxSidesOptions = {
  value: unknown;
  fallback?: BoxSides;
};

export function parseBoxSides(options: ParseBoxSidesOptions): BoxSides {
  const { value, fallback = { top: 0, right: 0, bottom: 0, left: 0 } } = options;
  if (typeof value === "number" && Number.isFinite(value)) {
    const v = Math.max(0, value);
    return { top: v, right: v, bottom: v, left: v };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return {
      top: Math.max(0, Number(o.top) || 0),
      right: Math.max(0, Number(o.right) || 0),
      bottom: Math.max(0, Number(o.bottom) || 0),
      left: Math.max(0, Number(o.left) || 0),
    };
  }
  return fallback;
}
