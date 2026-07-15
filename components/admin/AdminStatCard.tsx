"use client";

import { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  fullValue?: string;
  description?: string;
  icon: ReactNode;
  sparkline?: number[];
}

export default function AdminStatCard({
  title,
  value,
  fullValue,
  description,
  icon,
  sparkline,
}: AdminStatCardProps) {
  const chartData = sparkline?.map((v, i) => ({ i, v })) ?? [];
  const gradientId = `spark-${title.replace(/\s+/g, "")}`;

  return (
    <div className="p-6 border border-border bg-card text-card-foreground rounded-2xl shadow-sm transition-all hover:shadow-md w-full min-w-0 flex flex-col justify-between h-full group">
      <div className="flex justify-between items-start gap-4 w-full min-w-0">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground break-words leading-relaxed">
            {title}
          </p>
          <h2
            title={fullValue}
            className="text-xl font-extrabold tracking-tight sm:text-2xl xl:text-2xl whitespace-nowrap text-foreground tabular-nums leading-none mt-1"
          >
            {value}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground break-words leading-relaxed mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-muted/40 shrink-0 select-none border border-border/20 transition-colors group-hover:bg-muted">
          {icon}
        </div>
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="h-10 w-full mt-3 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--primary)"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
