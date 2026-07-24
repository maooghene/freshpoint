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
  // 1. Fetch Business, Schedules, and count total active staff
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      schedules: true,
      staff: true,
    },
  });

  if (!business) throw new Error("Business not found");

  const totalStaffCount = business.staff.length;
  if (totalStaffCount === 0) return [];

  // Parse YYYY-MM-DD reliably without local timezone parsing shifts
  const [year, month, day] = dateStr.split("-").map(Number);

  // Construct a reference string to safely read the target day of the week
  const referenceDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = referenceDate
    .toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
    .toUpperCase();

  const daySchedule = business.schedules.find((s) => s.day === dayOfWeek);
  if (!daySchedule || daySchedule.isClosed) return [];

  const [openHour, openMin] = daySchedule.openTime.split(":").map(Number);
  const [closeHour, closeMin] = daySchedule.closeTime.split(":").map(Number);

  // Parse bounds safely inside the business's explicit timezone setting
  const startWindow = new Date(`${dateStr}T${daySchedule.openTime}:00.000Z`);
  const endWindow = new Date(`${dateStr}T${daySchedule.closeTime}:00.000Z`);

  // Broad database query filter bounds for the selected date
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  // 2. Fetch concurrent active bookings running on this date range
  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: { startTime: true, endTime: true, staffId: true },
  });

  const availableSlots: string[] = [];
  const gridIntervalMinutes = 15;
  const totalServiceTimeNeeded =
    serviceDurationMinutes + business.bufferTimeMinutes;

  let currentSlotStart = new Date(startWindow.getTime());

  // 3. Grid allocation iteration
  while (
    currentSlotStart.getTime() + totalServiceTimeNeeded * 60 * 1000 <=
    endWindow.getTime()
  ) {
    const currentSlotEnd = new Date(
      currentSlotStart.getTime() + totalServiceTimeNeeded * 60 * 1000,
    );

    // Count how many bookings overlap with this explicit time block
    const overlappingBookingsCount = existingBookings.filter((booking) => {
      const bStart = booking.startTime.getTime();
      const bEnd = booking.endTime.getTime();
      const sStart = currentSlotStart.getTime();
      const sEnd = currentSlotEnd.getTime();

      return sStart < bEnd && sEnd > bStart;
    }).length;

    // Multi-staff capacity verification
    if (overlappingBookingsCount < totalStaffCount) {
      // Return unmutated clean 24hr format text representation
      const hh = String(currentSlotStart.getUTCHours()).padStart(2, "0");
      const mm = String(currentSlotStart.getUTCMinutes()).padStart(2, "0");
      availableSlots.push(`${hh}:${mm}`);
    }

    // Progress grid slot pointer securely without reference pollution
    currentSlotStart = new Date(
      currentSlotStart.getTime() + gridIntervalMinutes * 60 * 1000,
    );
  }

  return availableSlots;
}
