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
        if (!member.schedules || member.schedules.length === 0) return true;
        const daySchedule = member.schedules.find((s) => {
          const dbDay = s.day.trim().toUpperCase();
          return dbDay === targetDayStr;
        });
        return daySchedule ? !daySchedule.isOff : true;
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

  if (staffId && staffId !== "any") {
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
