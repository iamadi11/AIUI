"use client";

import {
  Bar,
  BarChart as RBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export function BarChartWidget({
  data,
  title,
}: {
  data: unknown;
  title?: string;
}) {
  if (!Array.isArray(data) || !data.every((x) => typeof x === "number")) {
    return null;
  }
  const nums = data as number[];
  const chartData = nums.map((v, i) => ({ name: String(i + 1), value: v }));
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="h-[280px] rounded-xl border border-border/60 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" opacity={0.08} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
