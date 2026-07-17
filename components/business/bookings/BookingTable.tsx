"use client";

import * as React from "react";
import { Booking, BookingStatus } from "./types";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingReminderBadge } from "./BookingReminderBadge";

interface BookingTableProps {
  bookings: Booking[];
  onUpdateStatus: (id: string, status: BookingStatus) => Promise<void>;
  onRowClick: (booking: Booking) => void;
}

export default function BookingTable({
  bookings,
  onUpdateStatus,
  onRowClick,
}: BookingTableProps) {
  return (
    <div className="w-full h-full overflow-y-auto overflow-x-auto border border-border bg-card rounded-2xl shadow-sm relative scrollbar-thin">
      <table className="w-full min-w-[800px] text-sm text-left text-muted-foreground border-collapse table-auto">
        <thead className="text-xs uppercase bg-secondary text-foreground border-b border-border sticky top-0 z-20">
          <tr>
            <th className="px-6 py-4 font-bold bg-secondary sticky top-0">
              {"Client"}
            </th>
            <th className="px-6 py-4 font-bold bg-secondary sticky top-0">
              {"Menu Option"}
            </th>
            <th className="px-6 py-4 font-bold bg-secondary sticky top-0">
              {"Booked On"}
            </th>
            <th className="px-6 py-4 font-bold bg-secondary sticky top-0">
              {"Scheduled Time"}
            </th>
            <th className="px-6 py-4 font-bold bg-secondary sticky top-0">
              {"Price"}
            </th>
            <th className="px-6 py-4 font-bold bg-secondary sticky top-0">
              {"Status"}
            </th>
            <th className="px-6 py-4 text-right bg-secondary sticky top-0">
              {"Actions"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card relative z-10">
          {bookings.map((booking: Booking) => {
            const displayPrice = (booking.item?.price ?? 0).toLocaleString();
            const serviceName = booking.item?.name || "General Appointment";
            const clientName = booking.user?.firstName
              ? `${booking.user.firstName} ${booking.user.lastName || ""}`.trim()
              : "Client Profile";

            return (
              <tr
                key={booking.id}
                onClick={() => onRowClick(booking)}
                className="hover:bg-secondary/40 transition-colors cursor-pointer group/row"
              >
                {/* Client Cell with Sub-badge Component */}
                <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                  <div>{clientName}</div>
                  <BookingReminderBadge
                    isReminderSent={booking.isReminderSent}
                  />
                </td>

                <td className="px-6 py-4 max-w-[200px] truncate font-medium text-foreground whitespace-nowrap">
                  {serviceName}
                </td>

                <td className="px-6 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {booking.createdAt
                    ? new Date(booking.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </td>

                <td className="px-6 py-4 text-xs font-mono whitespace-nowrap">
                  {booking.startTime
                    ? new Date(booking.startTime).toLocaleString("en-NG")
                    : "N/A"}
                </td>

                <td className="px-6 py-4 font-black text-primary whitespace-nowrap">
                  ₦{displayPrice}
                </td>

                {/* Status Badge Component */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <BookingStatusBadge status={booking.status} />
                </td>

                {/* Action Dropdown Options Column */}
                <td
                  className="px-6 py-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative inline-block text-left group">
                    <button
                      type="button"
                      className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-sm ${booking.status === "CONFIRMED" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" : booking.status === "PENDING" ? "border-amber-500/30 bg-amber-500/5 text-amber-600" : "border-primary/30 bg-primary/5 text-primary"}`}
                    >
                      <span>{booking.status}</span>
                      <svg
                        className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-36 rounded-xl bg-card border border-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 p-1">
                      {(
                        [
                          "PENDING",
                          "CONFIRMED",
                          "COMPLETED",
                          "CANCELLED",
                        ] as BookingStatus[]
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => void onUpdateStatus(booking.id, st)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left hover:bg-secondary/60 ${booking.status === st ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
                        >
                          {st.charAt(0) + st.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
