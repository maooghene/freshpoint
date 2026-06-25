// src/components/business/bookings/BookingTable.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { Booking, BookingStatus } from "./types";

interface BookingTableProps {
  bookings: Booking[];
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  onRowClick: (booking: Booking) => void;
}

export default function BookingTable({
  bookings,
  onUpdateStatus,
  onRowClick,
}: BookingTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-background/40 backdrop-blur-md shadow-xl">
      <table className="w-full text-sm text-left">
        <thead className="bg-primary/5 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
          <tr>
            {["Client", "Offering", "Price", "Payment", "Status", "Time"].map(
              (heading, i) => (
                <th key={i} className="px-6 py-4">
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-primary/5">
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className="hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => onRowClick(booking)}
            >
              <td className="px-6 py-4 font-bold">
                {booking.user?.firstName} {booking.user?.lastName}
              </td>

              <td className="px-6 py-4">{booking.item?.name}</td>

              <td className="px-6 py-4 font-black text-primary">
                ₦{booking.item?.price.toLocaleString()}
              </td>

              <td className="px-6 py-4">
                <Badge variant="outline" className="capitalize">
                  {booking.paymentStatus || "unpaid"}
                </Badge>
              </td>

              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <select
                  value={booking.status}
                  onChange={(e) =>
                    toast.promise(
                      onUpdateStatus(
                        booking.id,
                        e.target.value as BookingStatus,
                      ),
                      {
                        pending: "Updating booking...",
                        success: "Booking updated",
                        error: "Failed to update booking",
                      },
                    )
                  }
                  className="bg-background border border-primary/10 rounded-lg text-[11px] font-bold p-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </td>

              <td className="px-6 py-4 text-xs">
                {new Date(booking.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
