"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Input,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dynaui/ui";

export function DataTableWidget({
  data,
  title,
  pageSize = 20,
  onRowClick,
}: {
  data: unknown;
  title?: string;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, unknown> | null>(null);

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((r) => r && typeof r === "object" && !Array.isArray(r)) as Record<
      string,
      unknown
    >[];
  }, [data]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const r of rows.slice(0, 50)) {
      Object.keys(r).forEach((k) => keys.add(k));
    }
    return [...keys];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) =>
        String(r[c] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, columns, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (!rows.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
        <Input
          placeholder="Search…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          className="h-8 max-w-[200px] text-xs"
        />
      </div>
      <ScrollArea className="h-[420px] w-full rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
              {columns.map((c) => (
                <TableHead key={c} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground h-9">
                  {formatColumnName(c)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((row, i) => (
              <TableRow
                key={i}
                data-state={expanded === row ? "selected" : undefined}
                className="cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => {
                  setExpanded(expanded === row ? null : row);
                  onRowClick?.(row);
                }}
              >
                {columns.map((c) => (
                  <TableCell key={c} className="max-w-[220px] truncate text-xs py-2.5">
                    {formatCell(row[c])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {filtered.length} rows · {safePage + 1} / {pageCount}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
      {expanded && (
        <pre className="max-h-40 overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {JSON.stringify(expanded, null, 2)}
        </pre>
      )}
    </div>
  );
}

function formatColumnName(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
