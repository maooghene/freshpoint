// src/components/business/schedule/types.ts
export type Day =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface ScheduleItem {
  day: Day;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export const DAYS: Day[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
  "FRIDAY", "SATURDAY", "SUNDAY",
];
