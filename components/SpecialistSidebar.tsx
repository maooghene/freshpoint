"use client";

import * as React from "react";
import { Check, MoonIcon } from "lucide-react";

interface EvaluatedStaff {
  id: string;
  name: string;
  isOffDutyToday: boolean;
}

interface SpecialistSidebarProps {
  selectedStaff: string;
  setSelectedStaff: (id: string) => void;
  setSelectedSlot: (time: string) => void;
  evaluatedStaffRoster: EvaluatedStaff[];
}

export function SpecialistSidebar({
  selectedStaff,
  setSelectedStaff,
  setSelectedSlot,
  evaluatedStaffRoster,
}: SpecialistSidebarProps) {
  return (
    <div className="bg-card border border-border rounded-[2rem] p-6 space-y-5 shadow-xs">
      <div className="space-y-1">
        <h3 className="font-extrabold text-lg tracking-tight text-foreground">
          Select Specialist
        </h3>
        <p className="text-[11px] text-muted-foreground font-medium">
          Choose a provider for your appointment
        </p>
      </div>

      <div className="space-y-2.5">
        {/* ANY PROFESSIONAL OPTION */}
        <button
          type="button"
          onClick={() => {
            setSelectedStaff("any");
            setSelectedSlot("");
          }}
          className={`w-full flex items-center gap-3 p-3.5 border rounded-2xl transition-all text-left cursor-pointer ${
            selectedStaff === "any"
              ? "border-primary bg-primary/10 dark:bg-primary/15 shadow-sm"
              : "border-border bg-background/50 hover:border-primary/40 hover:bg-muted/40"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              selectedStaff === "any"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedStaff === "any" ? <Check size={14} /> : "★"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-foreground block">
              Any Professional
            </span>
            <span className="text-[10px] text-muted-foreground">
              Auto-assign best available
            </span>
          </div>
          {selectedStaff === "any" && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </button>

        {evaluatedStaffRoster.length === 0 ? (
          <div className="p-4 bg-muted/50 border border-border rounded-2xl text-center">
            <p className="text-[11px] font-bold text-muted-foreground">
              No specialists registered yet.
            </p>
          </div>
        ) : (
          evaluatedStaffRoster.map((member) => (
            <button
              key={member.id}
              type="button"
              disabled={member.isOffDutyToday}
              onClick={() => {
                if (member.isOffDutyToday) return;
                setSelectedStaff(member.id);
                setSelectedSlot("");
              }}
              className={`w-full flex items-center justify-between p-3.5 border rounded-2xl transition-all text-left group ${
                member.isOffDutyToday
                  ? "border-border/50 bg-muted/20 dark:bg-muted/10 cursor-not-allowed"
                  : selectedStaff === member.id
                    ? "border-primary bg-primary/10 dark:bg-primary/15 shadow-sm cursor-pointer"
                    : "border-border bg-background/50 hover:border-primary/40 hover:bg-muted/40 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* AVATAR */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
                    member.isOffDutyToday
                      ? "bg-muted text-muted-foreground/50 dark:bg-muted/30"
                      : selectedStaff === member.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary dark:bg-primary/20"
                  }`}
                >
                  {selectedStaff === member.id && !member.isOffDutyToday ? (
                    <Check size={14} />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* NAME */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs font-bold block truncate transition-colors ${
                      member.isOffDutyToday
                        ? "text-muted-foreground/60 dark:text-muted-foreground/40"
                        : "text-foreground"
                    }`}
                  >
                    {member.name}
                  </span>
                  {!member.isOffDutyToday && (
                    <span className="text-[10px] text-muted-foreground">
                      Available today
                    </span>
                  )}
                </div>
              </div>

              {/* OFF DUTY BADGE */}
              {member.isOffDutyToday && (
                <div className="flex items-center gap-1.5 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg shrink-0">
                  <MoonIcon size={10} className="shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    Off Today
                  </span>
                </div>
              )}

              {/* SELECTED INDICATOR */}
              {selectedStaff === member.id && !member.isOffDutyToday && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 ml-2" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
