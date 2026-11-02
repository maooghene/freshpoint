import { z } from "zod";
import { BookingStatus, DayOfWeek, OrderStatus } from "@prisma/client";

/**
 * Enum schemas shared by several routes. Anything written to a status column
 * must be validated against the real enum, never trusted as a free string.
 */

/** Accepts any casing / surrounding whitespace, outputs the exact enum value. */
export const orderStatusSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(OrderStatus));

export const bookingStatusSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(BookingStatus));

export const dayOfWeekSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(DayOfWeek));
