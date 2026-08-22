import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CalendarClock, ShieldCheck, Clock, Moon } from "lucide-react";

export default async function StaffSchedulePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  const userProfile = await prisma.user.findUnique({
    where: { clerkId },
    include: { staffProfile: true },
  });

  if (!userProfile?.staffProfile || !userProfile.staffProfile.isActive) {
    redirect("/");
  }

  const staff = userProfile.staffProfile;

  // 🎯 FIXED DATA MATCHING LAYER: Fetch all rota rows assigned to this staff member
  const rawSchedules = await prisma.staffSchedule.findMany({
    where: { staffId: staff.id },
  });

  // Chronological mapping constant used to sort database enum arrays cleanly
  const chronologicalDayMap: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
  };

  // Sort schedules so the rota displays logically from Monday through Sunday
  const sortedSchedules = [...rawSchedules].sort((a, b) => {
    const dayA = chronologicalDayMap[String(a.day).toUpperCase()] || 99;
    const dayB = chronologicalDayMap[String(b.day).toUpperCase()] || 99;
    return dayA - dayB;
  });

  return (
    <main className="min-h-screen bg-background pt-8 pb-12 px-4 sm:px-6 lg:px-8 font-sans w-full max-w-5xl mx-auto min-w-0">
      {/* Top Header Section */}
      <div className="flex flex-col gap-1 border-b border-border pb-6 mb-8 min-w-0">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground truncate">
          {"My Shift Schedule"}
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm font-medium truncate">
          {
            "Review your weekly duty blocks, service windows, and manager-allocated hours."
          }
        </p>
      </div>

      {/* Security Level Informational Core Notice Area Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-xs md:text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400">
        <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">
            {"Manager Lockout Authorization Rule Enforced"}
          </p>
          <p className="opacity-90 leading-relaxed">
            {
              "To ensure consistent customer tracking across all booking calendars, adjustments to working hours must be processed directly by your manager or business workspace owner."
            }
          </p>
        </div>
      </div>

      {/* Rota Visualization Core Layout */}
      {sortedSchedules.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/50">
          <CalendarClock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">
            {
              "No operational weekly rota parameters initialized for your profile."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 w-full min-w-0">
          {sortedSchedules.map((rota) => {
            // 🎯 SYNCED SCHEMA MAP: Inverting your internal isOff boolean to compute user-friendly availability status text
            const isAvailable = !rota.isOff;

            return (
              <div
                key={rota.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl min-w-0 shadow-3xs gap-4 transition-all duration-200 ${
                  rota.isOff
                    ? "bg-muted/30 border-border/60 opacity-75"
                    : "bg-card border-border hover:shadow-xs"
                }`}
              >
                {/* Left Block: Day Metadata and Sub-Labels */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      rota.isOff
                        ? "bg-secondary text-muted-foreground border-border"
                        : "bg-primary/5 text-primary border-primary/10"
                    }`}
                  >
                    {rota.isOff ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-foreground truncate uppercase tracking-wider">
                      {/* Maps directly to your custom Day Enum property value */}
                      {String(rota.day)}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {isAvailable
                        ? "Active Service Operations Floor Track"
                        : "Assigned Off-Duty Matrix Block"}
                    </p>
                  </div>
                </div>

                {/* Right Block: Chronological Opening/Closing Boundary Sequences & Status Indicators */}
                <div className="flex flex-row items-center sm:justify-end gap-4 shrink-0 select-none">
                  {isAvailable && (
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground bg-muted/60 px-3 py-1.5 border border-border/80 rounded-xl shadow-3xs">
                      {/* Enforces your standard boundary strings ("09:00" to "16:30") dynamically */}
                      <span>{rota.startTime || "09:00"}</span>
                      <span className="text-[10px] text-muted-foreground font-sans lowercase">
                        {"to"}
                      </span>
                      <span>{rota.endTime || "17:00"}</span>
                    </div>
                  )}

                  <span
                    className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      isAvailable
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40"
                    }`}
                  >
                    {isAvailable ? "On Duty" : "Off Duty"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
