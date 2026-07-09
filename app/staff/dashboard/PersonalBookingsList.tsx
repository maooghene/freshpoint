// app/staff/dashboard/PersonalBookingsList.tsx
"use client";

import * as React from "react";
import { CalendarX, Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ClientBookingDataShape } from "./StaffDashboardClient";

interface ListProps {
  bookings: ClientBookingDataShape[];
  search: string;
}

export function PersonalBookingsList({ bookings, search }: ListProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return bookings;

    return bookings.filter((b) => {
      const fullName =
        `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.toLowerCase();
      const matchEmail = (b.user?.email || "").toLowerCase();
      const matchId = b.id.toLowerCase();
      return (
        fullName.includes(query) ||
        matchEmail.includes(query) ||
        matchId.includes(query)
      );
    });
  }, [bookings, search]);

  // 🔄 The Interactive API Mutate Execution Event Handler
  const handleUpdateStatus = async (bookingId: string, nextStatus: string) => {
    setLoadingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || "Failed to update booking ledger.");
        return;
      }

      toast.success(
        `Booking marked as ${nextStatus.toLowerCase()} successfully.`,
      );
      // Force Next.js client router origin to revalidate data stream layers safely
      window.location.reload();
    } catch (err: unknown) {
      toast.error("Endpoint operational connection exception detected.");
    } finally {
      setLoadingId(null);
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-12 text-center bg-card/40">
        <CalendarX className="h-8 w-8 text-muted-foreground/60 mb-3" />
        <p className="text-xs font-bold text-foreground">
          {"No matching appointments found."}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {"Try modifying your query terms."}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden w-full min-w-0 shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground text-[10px] uppercase tracking-wider select-none">
              <th className="p-4">{"Client / User"}</th>
              <th className="p-4">{"Schedule Node"}</th>
              <th className="p-4">{"Session Status"}</th>
              <th className="p-4 text-right">{"Action / Revenue"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((booking) => {
              const isActionable =
                booking.status === "CONFIRMED" || booking.status === "PENDING";
              const isLoading = loadingId === booking.id;

              return (
                <tr
                  key={booking.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="p-4 min-w-[150px]">
                    <div className="font-bold text-foreground">
                      {booking.user?.firstName} {booking.user?.lastName}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                      {booking.user?.email}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-foreground">
                      {new Date(
                        booking.startTime || booking.createdAt,
                      ).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {"Assigned Task Matrix Slot"}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        booking.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : booking.status === "CONFIRMED"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-right min-w-[140px]">
                    <div className="flex items-center justify-end gap-3">
                      {isActionable && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(booking.id, "COMPLETED")
                          }
                          disabled={isLoading}
                          type="button"
                          className="inline-flex h-7 items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              {"Complete"}
                            </>
                          )}
                        </button>
                      )}
                      <span className="font-mono font-bold text-foreground tabular-nums">
                        {"₦"}
                        {(booking.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
