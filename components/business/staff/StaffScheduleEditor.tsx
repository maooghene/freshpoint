"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { XIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffMember, StaffSchedule } from "./types";

interface StaffScheduleEditorProps {
  staff: StaffMember;
  businessId: string;
  businessSlug: string;
  onClose: () => void;
  onUpdate: (schedules: StaffSchedule[]) => void;
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function StaffScheduleEditor({
  staff,
  businessId,
  businessSlug,
  onClose,
  onUpdate,
}: StaffScheduleEditorProps): React.JSX.Element {
  const buildInitialSchedule = (): StaffSchedule[] => {
    return DAYS.map((day) => {
      const existing = staff.schedules.find((s) => s.day === day);
      return {
        id: existing?.id || "",
        day,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
        isOff: existing?.isOff ?? false,
      };
    });
  };

  const [schedule, setSchedule] = useState<StaffSchedule[]>(
    buildInitialSchedule(),
  );
  const [saving, setSaving] = useState<boolean>(false);

  const updateDay = (
    day: string,
    field: "startTime" | "endTime" | "isOff",
    value: string | boolean,
  ): void => {
    setSchedule((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s)),
    );
  };

  const handleSaveSchedules = async (): Promise<void> => {
    // Robust validation parameter shield
    if (!businessId || !businessSlug) {
      toast.error(
        "Unable to locate parent business contextual path parameters.",
      );
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `/api/businesses/${businessId}/staff/${staff.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedules: schedule,
          }),
        },
      );

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to update shift logs");
      }

      toast.success("Teammate shifts updated successfully!");
      onUpdate(schedule);
      onClose();
    } catch (error: unknown) {
      const logMessage =
        error instanceof Error ? error.message : "Network failure";
      console.error("Schedule synchronization error:", logMessage);
      toast.error(logMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-black text-lg text-foreground">
              {staff.name}
              {"'s Schedule"}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {"Set working hours for each day of the week"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* SCHEDULE GRID */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {schedule.map((day) => (
            <div
              key={day.day}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                day.isOff
                  ? "border-border bg-muted/30 opacity-60"
                  : "border-border bg-background/50"
              }`}
            >
              {/* DAY NAME */}
              <span className="text-xs font-black text-foreground w-24 shrink-0">
                {day.day.charAt(0) + day.day.slice(1).toLowerCase()}
              </span>

              {/* DAY OFF TOGGLE */}
              <button
                type="button"
                onClick={() => updateDay(day.day, "isOff", !day.isOff)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition shrink-0 cursor-pointer ${
                  day.isOff
                    ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                {day.isOff ? "Day Off" : "Working"}
              </button>

              {/* TIME INPUTS */}
              {!day.isOff && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) =>
                      updateDay(day.day, "startTime", e.target.value)
                    }
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary transition cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground shrink-0 select-none">
                    {"to"}
                  </span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) =>
                      updateDay(day.day, "endTime", e.target.value)
                    }
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary transition cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 p-6 border-t border-border">
          <Button
            onClick={() => {
              void handleSaveSchedules();
            }}
            disabled={saving}
            className="flex-1 rounded-xl font-bold gap-2 cursor-pointer"
          >
            <SaveIcon className="w-4 h-4" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl font-bold cursor-pointer"
          >
            {"Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
