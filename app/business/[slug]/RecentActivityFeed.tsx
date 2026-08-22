"use client";

import * as React from "react";
import { Calendar, ShoppingBag, ArrowRight } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "BOOKING" | "ORDER";
  customerName: string;
  customerEmail: string;
  status: string;
  amount: number;
  createdAt: Date;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  
  // Status highlight tint resolver
  const getBadgeStyles = (type: "BOOKING" | "ORDER", status: string) => {
    const norm = status.trim().toUpperCase();
    if (norm === "COMPLETED" || norm === "DELIVERED") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }
    if (norm === "CANCELLED" || norm === "REJECTED") {
      return "border-destructive/20 bg-destructive/10 text-destructive";
    }
    return "border-primary/20 bg-primary/10 text-primary";
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-4 min-w-0 w-full text-foreground">
      <div className="flex items-center justify-between border-b border-border/60 pb-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Recent Activity Pipeline</h3>
          <p className="text-xs text-muted-foreground">Unified timeline of latest customer interactions across appointments and retail.</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs font-semibold text-muted-foreground select-none">
          📭 No operations recorded in this workspace over the recent cycle.
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-border bg-background/50">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 font-bold text-muted-foreground select-none">
                  <th className="p-3">Channel</th>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Customer Context</th>
                  <th className="p-3">Date/Time</th>
                  <th className="p-3">State</th>
                  <th className="p-3 text-right">Yield Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activities.map((act) => (
                  <tr key={`${act.type}-${act.id}`} className="hover:bg-secondary/30 transition-colors">
                    
                    {/* Channel Token Indicator */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 font-bold rounded-lg px-2 py-1 border ${
                        act.type === "BOOKING" 
                          ? "border-primary/20 bg-primary/5 text-primary" 
                          : "border-indigo-500/20 bg-indigo-500/5 text-indigo-500"
                      }`}>
                        {act.type === "BOOKING" ? (
                          <Calendar className="h-3 w-3 shrink-0" />
                        ) : (
                          <ShoppingBag className="h-3 w-3 shrink-0" />
                        )}
                        {act.type}
                      </span>
                    </td>

                    {/* Reference hash string */}
                    <td className="p-3 font-mono text-muted-foreground font-bold whitespace-nowrap">
                      #{act.id.slice(-8).toUpperCase()}
                    </td>

                    {/* Customer Info Box */}
                    <td className="p-3 min-w-0">
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="font-bold text-foreground truncate block">
                          {act.customerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block mt-0.5">
                          {act.customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Creation Date String */}
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Activity Operational State Badge */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-bold tracking-wide ${getBadgeStyles(act.type, act.status)}`}>
                        {act.status.toLowerCase()}
                      </span>
                    </td>

                    {/* Currency Yield Value Row */}
                    <td className="p-3 text-right font-black text-foreground whitespace-nowrap">
                      ₦{act.amount.toLocaleString()}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
