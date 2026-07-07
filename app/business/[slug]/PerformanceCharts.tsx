"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Calendar, ShoppingBag } from "lucide-react";

interface ChartDataPoint {
  period: string;
  Revenue: number;
  Bookings: number;
  Orders: number;
}

interface PerformanceChartsProps {
  data: ChartDataPoint[];
}

export default function PerformanceCharts({ data }: PerformanceChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
      {/* AREA GRAPH: REVENUE PERFORMANCE YIELDS */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Revenue Yield Velocity
            </h3>
            <p className="text-xs text-muted-foreground">
              Chronological cross-channel multi-tenant earning trajectories.
            </p>
          </div>
        </div>

        <div className="h-72 w-full mt-6 text-xs font-mono min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {/* 💡 INCREASED LEFT MARGIN FOR ADDITIONAL CONTAINER BREATHING ROOM */}
            <AreaChart
              data={data}
              margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.3}
              />

              <XAxis
                dataKey="period"
                className="fill-muted-foreground font-semibold text-[11px]"
                tickLine={false}
                axisLine={false}
                dy={10}
              />

              {/* 💡 THE ABSOLUTE FIX: Added width={80} to open up the left layout lane completely */}
              <YAxis
                width={75}
                className="fill-foreground font-bold text-[11px]"
                tickLine={false}
                axisLine={false}
                dx={-5}
                // 💡 DYNAMIC RANGE FORMATTER: Converts long figures into tidy compact notations (K, M, B)
                tickFormatter={(v: number) => {
                  return new Intl.NumberFormat("en-NG", {
                    notation: "compact",
                    compactDisplay: "short",
                    style: "currency",
                    currency: "NGN",
                    currencyDisplay: "narrowSymbol",
                  }).format(v);
                }}
              />

              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                  fontWeight: "bold",
                }}
                formatter={(value: unknown) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value) || 0;
                  return [`₦${numericValue.toLocaleString()}`, "Revenue"];
                }}
              />

              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="var(--primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RATIO VOLUMES BLOCK */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between min-w-0">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-base font-bold text-foreground">
            Operational Ratios
          </h3>
          <p className="text-xs text-muted-foreground">
            Volume parsing for scheduled appointments vs physical retail sales.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-5 my-6">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block text-foreground truncate">
                  Total Bookings
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Reservations processed
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-foreground">
              {data.reduce((acc, curr) => acc + curr.Bookings, 0)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block text-foreground truncate">
                  Total Orders
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Product sales shipped
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-foreground">
              {data.reduce((acc, curr) => acc + curr.Orders, 0)}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground font-medium bg-secondary/30 p-2.5 rounded-xl text-center border border-border/40">
          Analytics sync on-the-fly with multi-tenant data logs.
        </div>
      </div>
    </div>
  );
}
