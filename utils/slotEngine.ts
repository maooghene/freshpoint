import { prisma } from "@/lib/prisma";

interface SlotConfig {
  businessId: string;
  serviceDurationMinutes: number;
  dateStr: string; // "YYYY-MM-DD"
}

export async function getAvailableSlots({
  businessId,
  serviceDurationMinutes,
  dateStr,
}: SlotConfig) {
  // 1. Fetch Business, Schedules, and count total active staff assigned here
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      schedules: true,
      staff: true, // Pull staff profiles to evaluate simultaneous volume capacity
    },
  });

  if (!business) throw new Error("Business not found");

  const totalStaffCount = business.staff.length;
  if (totalStaffCount === 0) return []; // No staff members available to service bookings

  const targetDate = new Date(dateStr);

  // Get day string (e.g., "MONDAY") matching your DayOfWeek enum mapping requirements
  const dayOfWeek = targetDate
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();

  // ✅ FIXED FIELD: changed 'dayOfWeek' to your schema's 'day' property
  const daySchedule = business.schedules.find((s) => s.day === dayOfWeek);

  // ✅ FIXED FIELD: changed '!daySchedule.isOpened' to your schema's 'daySchedule.isClosed' inversion
  if (!daySchedule || daySchedule.isClosed) return [];

  // Parse operating hours string formats safely
  const [openHour, openMin] = daySchedule.openTime.split(":").map(Number);
  const [closeHour, closeMin] = daySchedule.closeTime.split(":").map(Number);

  const startWindow = new Date(targetDate.setHours(openHour, openMin, 0, 0));
  const endWindow = new Date(targetDate.setHours(closeHour, closeMin, 0, 0));

  // 2. Fetch concurrent bookings running today
  const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
  const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: { startTime: true, endTime: true, staffId: true },
  });

  const availableSlots: string[] = [];
  const gridIntervalMinutes = 15; // Baseline step interval grid
  const totalServiceTimeNeeded =
    serviceDurationMinutes + business.bufferTimeMinutes;

  let currentSlotStart = new Date(startWindow);

  while (
    currentSlotStart.getTime() + totalServiceTimeNeeded * 60 * 1000 <=
    endWindow.getTime()
  ) {
    const currentSlotEnd = new Date(
      currentSlotStart.getTime() + totalServiceTimeNeeded * 60 * 1000,
    );

    // 3. Count how many bookings overlap with this specific time block
    const overlappingBookingsCount = existingBookings.filter((booking) => {
      const bStart = booking.startTime.getTime();
      const bEnd = booking.endTime.getTime();
      const sStart = currentSlotStart.getTime();
      const sEnd = currentSlotEnd.getTime();

      return sStart < bEnd && sEnd > bStart;
    }).length;

    // 🚀 MULTI-STAFF CAPACITY CHECK:
    // The slot is open if overlapping bookings are LESS than total staff available
    if (overlappingBookingsCount < totalStaffCount) {
      availableSlots.push(
        currentSlotStart.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: business.timezone,
        }),
      );
    }

    currentSlotStart = new Date(
      currentSlotStart.getTime() + gridIntervalMinutes * 60 * 1000,
    );
  }

  return availableSlots;
}
