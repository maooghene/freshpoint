import { Prisma, BookingStatus } from "@prisma/client";

interface ServingCapacityCheck {
  db: Prisma.TransactionClient;
  businessId: string;
  staffId: string;
  dateString: string;
  startTime: Date;
  durationMinutes: number;
}

export async function validateServingCapacity({
  db,
  businessId,
  staffId,
  dateString,
  startTime,
  durationMinutes,
}: ServingCapacityCheck) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

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
  const targetDayStr = daysMap[localDateObject.getDay()];

  const businessData = await db.business.findUnique({
    where: { id: businessId },
    include: {
      staff: {
        where: { isActive: true },
        include: { schedules: true },
      },
    },
  });

  const activeStaff = businessData?.staff || [];
  const isSoloBusiness = activeStaff.length === 0;

  const availableStaffOnDuty = isSoloBusiness
    ? []
    : activeStaff.filter((member) => {
        // If a member has completely unseeded schedules, assume they follow store hours
        if (!member.schedules || member.schedules.length === 0) return true;

        const daySchedule = member.schedules.find((s) => {
          const dbDay = s.day.trim().toUpperCase();
          return dbDay === targetDayStr;
        });

        // 🎯 FIXED TRACKING RULE: If no row exists for this day, do not blindly return true.
        // Fallback to true only if they are the owner (userId matches business context), otherwise default to false (Off-duty).
        if (!daySchedule) {
          const isOwnerProvider = member.userId !== null; // Or use your custom role lookup flag
          return isOwnerProvider;
        }

        return !daySchedule.isOff;
      });

  const totalServingCapacity = isSoloBusiness ? 1 : availableStaffOnDuty.length;

  if (totalServingCapacity === 0) {
    return {
      isValid: false,
      reason:
        "No specialists are scheduled to work on this calendar day. Please pick a different date.",
    };
  }

  const overlappingBookings = await db.booking.findMany({
    where: {
      businessId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      NOT: {
        OR: [{ startTime: { gte: endTime } }, { endTime: { lte: startTime } }],
      },
    },
  });

  // 🎯 UPDATE THIS FINAL OVERLAP ALLOCATION RESOLUTION LAYER:
  if (overlappingBookings.length >= totalServingCapacity) {
    return {
      isValid: false,
      reason:
        "This time slot is fully booked. All available on-duty staff members are scheduled for this window.",
    };
  }

  if (isSoloBusiness) {
    return { isValid: true, assignedStaffId: null };
  }

  // Find a staff member who does not have an overlapping booking inside this exact time window
  const busyStaffIds = overlappingBookings
    .map((b) => b.staffId)
    .filter(Boolean);
  const freeStaff = availableStaffOnDuty.find(
    (member) => !busyStaffIds.includes(member.id),
  );

  // Fallback to the first scheduled on-duty worker if complex shifting matrixes overlap
  const finalAssignedStaffId = freeStaff
    ? freeStaff.id
    : availableStaffOnDuty[0].id;

  return {
    isValid: true,
    assignedStaffId: finalAssignedStaffId,
  };
}
