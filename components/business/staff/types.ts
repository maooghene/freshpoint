// components/business/staff/types.ts

export interface StaffSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  schedules: StaffSchedule[];
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  } | null;
}

export interface Business {
  id: string;
  name: string;
  staff: StaffMember[];
}
