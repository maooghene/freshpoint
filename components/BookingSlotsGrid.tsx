"use client";

import * as React from "react";
import { Loader2, CalendarOff, MoonIcon } from "lucide-react";

interface BookingSlotsGridProps {
  fetchingHours: boolean;
  isSelectedSpecialistOffDuty: boolean;
  calculatedSlots: string[];
  selectedSlot: string;
  setSelectedSlot: (time: string) => void;
}

export function BookingSlotsGrid({
  fetchingHours,
  isSelectedSpecialistOffDuty,
  calculatedSlots,
  selectedSlot,
  setSelectedSlot,
}: BookingSlotsGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-lg tracking-tight text-foreground">
          Available Slots
        </h3>
        {calculatedSlots.length > 0 && !isSelectedSpecialistOffDuty && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {calculatedSlots.length} slots open
          </span>
        )}
      </div>

      {fetchingHours ? (
        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground p-5 bg-muted/30 dark:bg-muted/20 rounded-2xl border border-dashed border-border">
          <Loader2 className="animate-spin w-4 h-4 text-primary shrink-0" />
          <span>Syncing provider schedule...</span>
        </div>
      ) : isSelectedSpecialistOffDuty ? (
        /* OFF DUTY NOTICE */
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-orange-500/25 dark:border-orange-500/20 bg-gradient-to-b from-orange-500/8 to-orange-500/4 dark:from-orange-500/10 dark:to-orange-500/5 gap-3 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <MoonIcon className="w-6 h-6 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground tracking-tight">
              Specialist is Off Today
            </p>
            <p className="text-xs text-muted-foreground font-medium max-w-[240px] leading-relaxed">
              This professional isn&apos;t available on the selected date.
              Switch to{" "}
              <strong className="text-foreground font-bold">
                Any Professional
              </strong>{" "}
              or pick another team member.
            </p>
          </div>
        </div>
      ) : calculatedSlots.length === 0 ? (
        /* CLOSED DAY NOTICE */
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-destructive/20 dark:border-destructive/15 bg-gradient-to-b from-destructive/5 to-transparent dark:from-destructive/8 gap-3 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-destructive/10 dark:bg-destructive/15 border border-destructive/20 flex items-center justify-center">
            <CalendarOff className="w-6 h-6 text-destructive dark:text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground tracking-tight">
              Closed on This Day
            </p>
            <p className="text-xs text-muted-foreground font-medium max-w-[240px] leading-relaxed">
              This wellness space isn&apos;t open on the selected date. Please
              pick a different day from the calendar above.
            </p>
          </div>
        </div>
      ) : (
        /* TIME SLOTS GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
          {calculatedSlots.map((time: string) => (
            <button
              key={time}
              type="button"
              onClick={() => setSelectedSlot(time)}
              className={`p-3 text-center rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                selectedSlot === time
                  ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "border-border bg-background/60 dark:bg-background/30 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 text-foreground hover:scale-[1.01]"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
