// src/lib/booking-validator.ts
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

interface ServingCapacityCheck {
  businessId: string;
  staffId: string; // The specialist chosen ("any" or a specific staff ID string)
  startTime: Date; // Requested arrival time
  durationMinutes: number; // Length of the service item treatment
}

export async function validateServingCapacity({
  businessId,
  staffId,
  startTime,
  durationMinutes,
}: ServingCapacityCheck) {
  // 1. Calculate when the requested new appointment will end
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // 2. Fetch the full list of staff members currently employed at this business
  const businessData = await prisma.business.findUnique({
    where: { id: businessId },
    include: { staff: true }, // Pulls all staff records linked to this tenant
  });

  const availableStaff = businessData?.staff.filter((s) => s.isActive) || [];
  const totalServingCapacity = availableStaff.length;

  if (totalServingCapacity === 0) {
    return {
      isValid: false,
      reason:
        "This business currently has no active staff members available to provide services.",
    };
  }

  // 3. Query ALL active bookings that overlap with this requested time window
  // Rule: An existing booking overlaps if it starts BEFORE our new endTime AND ends AFTER our new startTime
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      NOT: {
        OR: [
          { startTime: { gte: endTime } }, // Existing booking starts after our requested end
          { endTime: { lte: startTime } }, // Existing booking ends before our requested start
        ],
      },
    },
  });

  // 🛑 FILTER RULE 1: Global Shop Serving Capacity
  // If the number of active appointments inside this time block equals or exceeds your total staff count, the shop is fully booked!
  if (overlappingBookings.length >= totalServingCapacity) {
    return {
      isValid: false,
      reason:
        "This time slot is fully booked. All available staff members are scheduled for this time window.",
    };
  }

  // 🛑 FILTER RULE 2: Specific Staff Member Availability Check
  if (staffId !== "any") {
    // Check if the specific requested staff member is caught inside any of the overlapping bookings
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
  }

  // 4. Success Flow: Return true and pass along the busy staff IDs so the router can auto-assign a free professional
  const busyStaffIds = overlappingBookings
    .map((b) => b.staffId)
    .filter(Boolean) as string[];
  const freeStaffMembers = availableStaff.filter(
    (member) => !busyStaffIds.includes(member.id),
  );

  return {
    isValid: true,
    assignedStaffId:
      staffId !== "any" ? staffId : freeStaffMembers[0]?.id || null,
  };
}
