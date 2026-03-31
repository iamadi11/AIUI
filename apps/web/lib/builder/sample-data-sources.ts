export const SAMPLE_DATA_SOURCES: Record<string, unknown> = {
  orders: {
    rows: [
      { id: "o-100", status: "paid", total: 129.5, customer: { name: "Ava" } },
      { id: "o-101", status: "pending", total: 84.2, customer: { name: "Noah" } },
    ],
    summary: { totalRevenue: 213.7, totalOrders: 2 },
  },
  users: {
    list: [
      { id: "u-1", name: "Ava", role: "admin" },
      { id: "u-2", name: "Noah", role: "analyst" },
    ],
    meta: { activeCount: 2 },
  },
};

export const SAMPLE_STATE_PATHS: readonly string[] = [
  "filters.search",
  "filters.status",
  "selection.rowId",
  "ui.modalOpen",
] as const;

export const SAMPLE_STATE: Record<string, unknown> = {
  filters: { search: "ava", status: "paid" },
  selection: { rowId: "o-100" },
  ui: { modalOpen: false },
};

function isObjectLike(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function listDataPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    const head = value[0];
    if (isObjectLike(head)) {
      const nested = listDataPaths(head, "");
      return [prefix, ...nested.map((p) => (p ? `${prefix}.[].${p}` : `${prefix}.[]`))];
    }
    return [prefix];
  }
  if (!isObjectLike(value)) return [prefix].filter(Boolean);
  const out: string[] = [];
  for (const [k, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${k}` : k;
    out.push(path);
    if (isObjectLike(v) || Array.isArray(v)) {
      out.push(...listDataPaths(v, path));
    }
  }
  return Array.from(new Set(out));
}

export function resolveDataPath(value: unknown, path: string): unknown {
  const clean = path.trim();
  if (!clean) return value;
  const tokens = clean.split(".").filter(Boolean);
  let current: unknown = value;
  for (const token of tokens) {
    if (token === "[]") {
      if (!Array.isArray(current) || current.length === 0) return undefined;
      current = current[0];
      continue;
    }
    if (!isObjectLike(current)) return undefined;
    current = current[token];
  }
  return current;
}
