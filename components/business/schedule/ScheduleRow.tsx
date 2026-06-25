// src/components/business/schedule/ScheduleRow.tsx
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
          ? "bg-muted/30 opacity-70"
          : "bg-card hover:border-primary/40"
      }`}
    >
      {/* DAY & STATUS CONTAINER */}
      <div className="flex items-center gap-4 min-w-[150px]">
        <div
          className={`p-2 rounded-full ${item.isClosed ? "bg-slate-200" : "bg-primary/10"}`}
        >
          <Clock
            className={`w-5 h-5 ${item.isClosed ? "text-slate-500" : "text-primary"}`}
          />
        </div>
        <div>
          <p className="font-bold text-lg leading-tight uppercase tracking-wider">
            {item.day.slice(0, 3)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
            {item.isClosed ? "Closed" : "Open for business"}
          </p>
        </div>
      </div>

      {/* TIME CONTROL FIELDS */}
      <div className="flex flex-1 items-center justify-between md:justify-end gap-8">
        {!item.isClosed ? (
          <div className="flex items-center gap-4">
            {/* OPENS AT INPUT */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sun className="w-3 h-3" /> Opens At
              </label>
              <input
                type="time"
                value={item.openTime || ""}
                onChange={(e) => onUpdate(index, "openTime", e.target.value)}
                className="border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none text-sm font-medium w-40 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[0.37] [&::-webkit-calendar-picker-indicator]:sepia-[0.96] [&::-webkit-calendar-picker-indicator]:saturate-[7.48] [&::-webkit-calendar-picker-indicator]:hue-rotate-[200deg]"
                step="300"
              />
            </div>

            <span className="mt-5 font-light text-muted-foreground">—</span>

            {/* CLOSES AT INPUT */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Moon className="w-3 h-3" /> Closes At
              </label>
              <input
                type="time"
                value={item.closeTime || ""}
                onChange={(e) => onUpdate(index, "closeTime", e.target.value)}
                className="border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none text-sm font-medium w-40 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[0.37] [&::-webkit-calendar-picker-indicator]:sepia-[0.96] [&::-webkit-calendar-picker-indicator]:saturate-[7.48] [&::-webkit-calendar-picker-indicator]:hue-rotate-[200deg]"
                step="300"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center md:text-right">
            <span className="text-sm font-semibold text-slate-400 italic">
              Closed All Day
            </span>
          </div>
        )}

        {/* TOGGLE ELEMENT */}
        <div className="border-l pl-6 flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={item.isClosed}
              onChange={(e) => onUpdate(index, "isClosed", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-destructive"></div>
            <span className="ml-3 text-xs font-bold text-muted-foreground">
              OFF
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
