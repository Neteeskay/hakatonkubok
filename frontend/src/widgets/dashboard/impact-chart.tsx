"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const emptySeries = [{ month: "-", hours: 0, tasks: 0 }];

export function ImpactChart({ data = emptySeries }: { data?: { month: string; hours: number; tasks: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 8" stroke="hsl(var(--foreground) / 0.08)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "0",
              background: "hsl(var(--surface))",
              color: "hsl(var(--foreground))"
            }}
          />
          <Area type="monotone" dataKey="hours" stroke="hsl(var(--accent-blue))" fill="hsl(var(--accent-blue) / 0.16)" strokeWidth={2} />
          <Area type="monotone" dataKey="tasks" stroke="hsl(var(--brand))" fill="hsl(var(--brand) / 0.2)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
