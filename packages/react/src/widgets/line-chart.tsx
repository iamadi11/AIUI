"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function LineChartWidget({
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
  const chartData = nums.map((v, i) => ({ x: i + 1, y: v }));
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
      <div className="h-[280px] rounded-xl border border-border/60 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.08} vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
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
            <Line type="monotone" dataKey="y" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
          </RLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
