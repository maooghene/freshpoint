// lib/booking-validator.ts
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

interface ServingCapacityCheck {
  businessId: string;
  staffId: string; // "any" or specific ID
  dateString: string; // "YYYY-MM-DD"
  startTime: Date;
  durationMinutes: number;
}

export async function validateServingCapacity({
  businessId,
  staffId,
  dateString,
  startTime,
  durationMinutes,
}: ServingCapacityCheck) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // 1. Calculate the day name cleanly using a local unshifted timeline split
  const daysMap = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const [year, month, day] = dateString.split("-").map(Number);
  const localDateObject = new Date(year, month - 1, day);
  const targetDayStr = daysMap[localDateObject.getDay()]; // e.g., "THURSDAY"

  // 2. Fetch the active staff profiles along with ALL their schedule lines
  const businessData = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      staff: {
        where: { isActive: true },
        include: { schedules: true },
      },
    },
  });

  const activeStaff = businessData?.staff || [];

  // 3. 💡 CRITICAL SAFETY FILTER: Exclude staff who are scheduled to be OFF DUTY
  const availableStaffOnDuty = activeStaff.filter((member) => {
    if (!member.schedules || member.schedules.length === 0) return true;

    // Defensive check matching UPPERCASE, lowercase, and Capitalized words safely
    const daySchedule = member.schedules.find((s) => {
      const dbDay = s.day.trim().toUpperCase();
      return dbDay === targetDayStr;
    });

    // If a schedule rule is found, return the opposite of isOff (if isOff is true, they are NOT available)
    return daySchedule ? !daySchedule.isOff : true;
  });

  const totalServingCapacity = availableStaffOnDuty.length;

  // 🚨 BACKEND FIREWALL 1: Block the slot completely if NO staff are on duty today
  if (totalServingCapacity === 0) {
    return {
      isValid: false,
      reason:
        "No specialists are scheduled to work on this calendar day. Please pick a different date.",
    };
  }

  // 4. Query active bookings that overlap with this requested window
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      NOT: {
        OR: [{ startTime: { gte: endTime } }, { endTime: { lte: startTime } }],
      },
    },
  });

  // 🚨 BACKEND FIREWALL 2: Block if global shop capacity is filled
  if (overlappingBookings.length >= totalServingCapacity) {
    return {
      isValid: false,
      reason:
        "This time slot is fully booked. All available on-duty staff members are scheduled for this window.",
    };
  }

  // 5. Specific Staff Member Availability & Off-Duty Check
  if (staffId && staffId !== "any") {
    // Verify if the specifically chosen worker is included in our ON-DUTY array helper
    const isSpecificWorkerOnDuty = availableStaffOnDuty.some(
      (s) => s.id === staffId,
    );

    if (!isSpecificWorkerOnDuty) {
      return {
        isValid: false,
        reason:
          "The requested professional is scheduled to be off duty on this day. Please select another provider or choose 'Any Professional'.",
      };
    }

    // Verify if they have a localized scheduling collision block
    const isSpecialistBusy = overlappingBookings.some(
      (b) => b.staffId === staffId,
    );
    if (isSpecialistBusy) {
      return {
        isValid: false,
        reason:
          "The requested professional is currently busy serving another client during this time slot.",
      };
    }
    return { isValid: true, assignedStaffId: staffId };
  }

  // 6. Success Auto-Routing Flow: Assign a free professional from the pool of active ON-DUTY workers
  const busyStaffIds = overlappingBookings
    .map((b) => b.staffId)
    .filter(Boolean) as string[];

  const freeStaff = availableStaffOnDuty.find(
    (member) => !busyStaffIds.includes(member.id),
  );

  return {
    isValid: true,
    assignedStaffId: freeStaff ? freeStaff.id : null,
  };
}
