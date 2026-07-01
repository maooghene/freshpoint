// src/components/business/bookings/types.ts

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string; // 🔑 Added to show when appointment was created
  queueCode: string | null; // 🔑 Added to track your user QR codes
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  item: {
    name: string;
    price: number;
    duration: number | null;
  };
  paymentStatus: string | null;
}
