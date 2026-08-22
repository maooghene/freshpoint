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
import { ChartPoint } from "@/lib/actions/admin-analytics";

interface AdminPerformanceChartsProps {
  data: ChartPoint[];
}

export default function AdminPerformanceCharts({
  data,
}: AdminPerformanceChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Platform Revenue Velocity
            </h3>
            <p className="text-xs text-muted-foreground">
              Chronological cross-tenant earnings trajectory, last 6 months.
            </p>
          </div>
        </div>

        <div className="h-72 w-full mt-6 text-xs font-mono min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis
                width={75}
                className="fill-foreground font-bold text-[11px]"
                tickLine={false}
                axisLine={false}
                dx={-5}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat("en-NG", {
                    notation: "compact",
                    compactDisplay: "short",
                    style: "currency",
                    currency: "NGN",
                    currencyDisplay: "narrowSymbol",
                  }).format(v)
                }
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
                fill="url(#adminRevGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between min-w-0">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-base font-bold text-foreground">
            Platform Volume Split
          </h3>
          <p className="text-xs text-muted-foreground">
            Bookings vs. orders across every registered vendor.
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
                  Reservations processed platform-wide
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
                  Product sales shipped platform-wide
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-foreground">
              {data.reduce((acc, curr) => acc + curr.Orders, 0)}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground font-medium bg-secondary/30 p-2.5 rounded-xl text-center border border-border/40">
          Analytics aggregate across all tenants in real time.
        </div>
      </div>
    </div>
  );
}
