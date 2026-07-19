"use client";

import { Clock, Sun, Moon } from "lucide-react";
import { ScheduleItem } from "./types";

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
  onUpdate: (
    index: number,
    field: keyof ScheduleItem,
    value: string | boolean,
  ) => void;
}

export default function ScheduleRow({
  item,
  index,
  onUpdate,
}: ScheduleRowProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-6 border rounded-2xl p-5 transition-colors ${
        item.isClosed
          ? "bg-muted/30 opacity-70 border-border"
          : "bg-card border-border hover:border-primary/40"
      }`}
    >
      {/* DAY & STATUS CONTAINER */}
      <div className="flex items-center gap-4 min-w-[150px] justify-center md:justify-start">
        <div
          className={`p-2 rounded-full ${item.isClosed ? "bg-slate-200" : "bg-primary/10"}`}
        >
          <Clock
            className={`w-5 h-5 ${item.isClosed ? "text-slate-500" : "text-primary"}`}
          />
        </div>
        <div>
          <p className="font-bold text-lg leading-tight uppercase tracking-wider text-foreground">
            {item.day.slice(0, 3)}
          </p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            {item.isClosed ? "🔴 Closed" : "🟢 Open for Business"}
          </p>
        </div>
      </div>

      {/* TIME CONTROL FIELDS */}
      <div className="flex flex-1 flex-col items-center gap-4 md:flex-row md:items-center md:justify-end md:gap-8">
        {!item.isClosed ? (
          <div className="flex items-center gap-4 animate-in fade-in duration-150">
            {/* OPENS AT INPUT */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-500" /> Opens At
              </label>
              <input
                type="time"
                value={item.openTime || ""}
                onChange={(e) => onUpdate(index, "openTime", e.target.value)}
                className="border border-border rounded-xl px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-bold w-36 cursor-pointer"
                step="300"
              />
            </div>

            <span className="mt-5 font-light text-muted-foreground select-none">
              —
            </span>

            {/* CLOSES AT INPUT */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-400" /> Closes At
              </label>
              <input
                type="time"
                value={item.closeTime || ""}
                onChange={(e) => onUpdate(index, "closeTime", e.target.value)}
                className="border border-border rounded-xl px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-bold w-36 cursor-pointer"
                step="300"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center md:text-right py-2 select-none">
            <span className="text-sm font-bold text-muted-foreground italic bg-muted px-4 py-1.5 rounded-xl border border-dashed">
              🔒 Shop Closed / Blocked from Public Bookings
            </span>
          </div>
        )}

        {/* 🛠️ REPAIRED TOGGLE ELEMENT: Maps logically to turn the store visibility settings on/off */}
        <div className="border-l border-border pl-6 flex items-center shrink-0">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              // Switch is checked when the store is open (not closed)
              checked={!item.isClosed}
              onChange={(e) => onUpdate(index, "isClosed", !e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted border border-border/80 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-3 text-xs font-black min-w-[45px] tracking-wider text-muted-foreground">
              {!item.isClosed ? "OPEN" : "CLOSED"}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
