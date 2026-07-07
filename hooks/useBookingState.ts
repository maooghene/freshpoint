import { useState, useEffect, useMemo } from "react";

interface HookStaffSchedule {
  day: string;
  isOff: boolean;
}

interface HookStaffMember {
  id: string;
  name: string;
  schedules?: HookStaffSchedule[];
}

interface HookItemDetails {
  id: string;
  business: {
    slug: string;
    staff: HookStaffMember[];
  };
}

interface HookBusinessSchedule {
  id: string;
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface EvaluatedStaffMember extends HookStaffMember {
  isOffDutyToday: boolean;
}

// ✅ Timezone-safe local date string (YYYY-MM-DD) using local clock not UTC
function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ✅ Parse date string as LOCAL date to avoid UTC timezone day shift
function parseDateLocal(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function getDayName(dateString: string): string {
  return DAY_NAMES[parseDateLocal(dateString).getDay()];
}

export function useBookingState(item: HookItemDetails) {
  const todayString = getLocalTodayString(); // ✅ local timezone, not UTC
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("any");
  const [storeSchedules, setStoreSchedules] = useState<HookBusinessSchedule[]>(
    [],
  );
  const [fetchingHours, setFetchingHours] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveBusinessHours() {
      try {
        setFetchingHours(true);
        const res = await fetch(
          `/api/businesses/slug/${item.business.slug}/schedule`,
        );
        if (!res.ok) throw new Error("Failed to load schedule");
        const data = await res.json();
        if (isMounted) setStoreSchedules(data.schedules || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setFetchingHours(false);
      }
    }

    if (item.business.slug) void loadLiveBusinessHours();
    return () => {
      isMounted = false;
    };
  }, [item.business.slug]);

  const calculatedSlots = useMemo<string[]>(() => {
    if (storeSchedules.length === 0 || !selectedDate) return [];

    const targetDayStr = getDayName(selectedDate); // ✅ timezone-safe
    const dayRule = storeSchedules.find((s) => s.day === targetDayStr);

    if (!dayRule || dayRule.isClosed) return [];

    const [startHour, startMin] = dayRule.openTime.split(":").map(Number);
    const [endHour, endMin] = dayRule.closeTime.split(":").map(Number);
    const slots: string[] = [];
    let ch = startHour;
    let cm = startMin;

    while (ch < endHour || (ch === endHour && cm <= endMin)) {
      const ampm = ch >= 12 ? "PM" : "AM";
      const dh = ch % 12 === 0 ? 12 : ch % 12;
      slots.push(
        `${dh.toString().padStart(2, "0")}:${cm.toString().padStart(2, "0")} ${ampm}`,
      );
      cm += 30;
      if (cm >= 60) {
        ch += 1;
        cm = 0;
      }
    }
    return slots;
  }, [selectedDate, storeSchedules]);

  const evaluatedStaffRoster = useMemo<EvaluatedStaffMember[]>(() => {
    if (!selectedDate || !item.business.staff) return [];

    const targetDayStr = getDayName(selectedDate);

    console.log(
      "STAFF DATA RECEIVED:",
      JSON.stringify(item.business.staff, null, 2),
    );
    console.log("TARGET DAY:", targetDayStr);

    return item.business.staff.map((staffMember: HookStaffMember) => {
      if (!staffMember.schedules || staffMember.schedules.length === 0) {
        console.log(
          `${staffMember.name}: NO SCHEDULES FOUND — defaulting to available`,
        );
        return { ...staffMember, isOffDutyToday: false };
      }
      const sched = staffMember.schedules.find(
        (s: HookStaffSchedule) => s.day.toUpperCase() === targetDayStr,
      );
      console.log(`${staffMember.name}: schedule for ${targetDayStr}:`, sched);
      return {
        ...staffMember,
        isOffDutyToday: sched ? sched.isOff : false,
      };
    });
  }, [selectedDate, item.business.staff]);

  const isSelectedSpecialistOffDuty = useMemo<boolean>(() => {
    if (selectedStaff === "any") return false;
    const found = evaluatedStaffRoster.find((s) => s.id === selectedStaff);
    return found?.isOffDutyToday ?? false;
  }, [selectedStaff, evaluatedStaffRoster]);

  return {
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    selectedStaff,
    setSelectedStaff,
    calculatedSlots,
    fetchingHours,
    evaluatedStaffRoster,
    isSelectedSpecialistOffDuty,
    todayString,
  };
}
