import prisma from "@/lib/prisma";
import { DayOfWeek } from "@prisma/client";
import { getDayNameFromDateString } from "@/lib/dateUtils";

/**
 * Assesses whether a staff member is explicitly flagged as off-duty for a given date.
 */
export async function isStaffOffDuty(
  staffId: string,
  dateTimeStr: string,
): Promise<{ isOff: boolean; dayName: string }> {
  const dateOnly = dateTimeStr.split("T")[0];
  const targetDayName = getDayNameFromDateString(dateOnly);

  const staffSchedule = await prisma.staffSchedule.findUnique({
    where: {
      staffId_day: {
        staffId,
        day: targetDayName as DayOfWeek,
      },
    },
  });

  return {
    isOff: !!(staffSchedule && staffSchedule.isOff),
    dayName: targetDayName,
  };
}

/**
 * Generates an collision-safe, highly recognizable marketplace booking identifier string.
 */
export async function generateUniqueQueueCode(): Promise<string> {
  let uniqueQueueCode = "";
  let isCodeUnique = false;

  while (!isCodeUnique) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetter = characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
    const randomNumber = Math.floor(10 + Math.random() * 90);
    uniqueQueueCode = `FP-${randomLetter}${randomNumber}`;

    const collisionCheck = await prisma.booking.findFirst({
      where: { queueCode: uniqueQueueCode },
      select: { id: true },
    });

    if (!collisionCheck) {
      isCodeUnique = true;
    }
  }

  return uniqueQueueCode;
}
