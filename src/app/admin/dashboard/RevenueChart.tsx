"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface Props {
  daily: DataPoint[];
  weekly: DataPoint[];
}

function formatNaira(value: number) {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}k`;
  return `₦${value}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      <p className="text-orange-400 font-bold">{formatNaira(payload[0]?.value ?? 0)}</p>
      <p className="text-slate-400 text-xs">{payload[1]?.value ?? 0} orders</p>
    </div>
  );
}

export default function RevenueChart({ daily, weekly }: Props) {
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const data = view === "daily" ? daily : weekly;
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-bold text-white text-lg">Revenue</h2>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-extrabold text-white">{formatNaira(totalRevenue)}</span>
            <span className="text-sm text-slate-400">{totalOrders} completed orders</span>
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-700 p-1 gap-1 self-start">
          {(["daily", "weekly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                view === v
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {v === "daily" ? "14 Days" : "8 Weeks"}
            </button>
          ))}
        </div>
      </div>

      {data.every((d) => d.revenue === 0) ? (
        <div className="h-52 flex items-center justify-center text-slate-500 text-sm">
          No completed orders yet — revenue will appear here.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatNaira}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#f97316", stroke: "#0f172a", strokeWidth: 2 }}
            />
            {/* Hidden series just for tooltip orders count */}
            <Area
              type="monotone"
              dataKey="orders"
              stroke="transparent"
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
