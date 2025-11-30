"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface DprPoint {
  ac: number;
  dpr: number;
}

interface DprVsAcChartProps {
  data: DprPoint[];
}

export function DprVsAcChart({ data }: DprVsAcChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-4 text-sm text-muted-foreground">
        No chart data. Run a calculation to see DPR vs AC.
      </div>
    );
  }

  return (
    <div className="mt-6 w-full h-80 rounded-2xl border border-border p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">DPR vs Target AC</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ac"
            label={{ value: "Target AC", position: "insideBottom", offset: -1 }}
          />
          <YAxis
            label={{
              value: "Expected DPR",
              angle: -90,
              position: "insideLeft",
              offset: 15,
            }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="dpr"
            name="Normal"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
