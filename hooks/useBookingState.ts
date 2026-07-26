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
  duration: number | null;
  business: {
    id: string;
    slug: string;
    staff: HookStaffMember[];
  };
}

interface EvaluatedStaffMember extends HookStaffMember {
  isOffDutyToday: boolean;
}

function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  const todayString = getLocalTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("any");
  const [calculatedSlots, setCalculatedSlots] = useState<string[]>([]);
  const [fetchingHours, setFetchingHours] = useState<boolean>(true);

  // Real, server-computed slots — respects actual service duration,
  // buffer time, staff off-duty status, and existing booking overlaps.
  useEffect(() => {
    let isMounted = true;

    async function loadRealSlots() {
      if (!selectedDate || !item.business.id) return;
      try {
        setFetchingHours(true);
        const res = await fetch(
          `/api/businesses/${item.business.id}/availability?date=${selectedDate}&itemId=${item.id}`,
        );
        const data = await res.json();
        if (isMounted) setCalculatedSlots(data.success ? data.slots : []);
      } catch (err) {
        console.error(err);
        if (isMounted) setCalculatedSlots([]);
      } finally {
        if (isMounted) setFetchingHours(false);
      }
    }

    void loadRealSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, item.business.id, item.id]);

  // Staff roster + off-duty evaluation — this part was already correct, unchanged.
  const [staffSchedulesLoaded] = useState(true); // kept for interface stability

  const evaluatedStaffRoster = useMemo<EvaluatedStaffMember[]>(() => {
    if (!selectedDate || !item.business.staff) return [];
    const targetDayStr = getDayName(selectedDate);

    return item.business.staff.map((staffMember: HookStaffMember) => {
      if (!staffMember.schedules || staffMember.schedules.length === 0) {
        return { ...staffMember, isOffDutyToday: false };
      }
      const sched = staffMember.schedules.find(
        (s: HookStaffSchedule) => s.day.toUpperCase() === targetDayStr,
      );
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
