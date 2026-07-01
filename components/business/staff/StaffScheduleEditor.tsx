// components/business/staff/StaffScheduleEditor.tsx
"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { XIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

interface StaffSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  schedules: StaffSchedule[];
}

interface Props {
  staff: StaffMember;
  onClose: () => void;
  onUpdate: (schedules: StaffSchedule[]) => void;
}

export default function StaffScheduleEditor({
  staff,
  onClose,
  onUpdate,
}: Props) {
  const buildInitialSchedule = () => {
    return DAYS.map((day) => {
      const existing = staff.schedules.find((s) => s.day === day);
      return {
        day,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
        isOff: existing?.isOff ?? false,
      };
    });
  };

  const [schedule, setSchedule] = useState(buildInitialSchedule());
  const [saving, setSaving] = useState(false);

  const updateDay = (
    day: string,
    field: "startTime" | "endTime" | "isOff",
    value: string | boolean,
  ) => {
    setSchedule((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/staff/${staff.id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });

      if (!res.ok) throw new Error("Failed to save schedule");

      const data = await res.json();
      onUpdate(data.schedules);
      toast.success("Schedule saved successfully");
      onClose();
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-black text-lg text-foreground">
              {staff.name}&apos;s Schedule
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Set working hours for each day of the week
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition"
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
                onClick={() => updateDay(day.day, "isOff", !day.isOff)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition shrink-0 ${
                  day.isOff
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary transition"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    to
                  </span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) =>
                      updateDay(day.day, "endTime", e.target.value)
                    }
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary transition"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 p-6 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl font-bold gap-2"
          >
            <SaveIcon className="w-4 h-4" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
