"use client";

import * as React from "react";
import {
  CalendarCheck2,
  Clock,
  MapPin,
  User,
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface UserPayload {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface BookingShape {
  id: string;
  status: string;
  totalAmount: number | null;
  createdAt: Date;
  startTime: Date | null;
  user: UserPayload | null;
}

interface StaffBookingsClientProps {
  initialBookings: BookingShape[];
}

export function StaffBookingsClient({
  initialBookings,
}: StaffBookingsClientProps) {
  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // High-performance structural text filtration matrix
  const filteredBookings = React.useMemo(() => {
    return initialBookings.filter((booking) => {
      const matchStatus =
        statusFilter === "ALL" ||
        booking.status.toUpperCase() === statusFilter.toUpperCase();

      const query = search.toLowerCase().trim();
      if (!query) return matchStatus;

      const fullName =
        `${booking.user?.firstName || ""} ${booking.user?.lastName || ""}`.toLowerCase();
      const matchEmail = (booking.user?.email || "").toLowerCase();
      const matchId = booking.id.toLowerCase();

      return (
        matchStatus &&
        (fullName.includes(query) ||
          matchEmail.includes(query) ||
          matchId.includes(query))
      );
    });
  }, [initialBookings, search, statusFilter]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Control Console Search & Filter Segment Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-border/80 bg-card p-4 rounded-2xl shadow-3xs">
        {/* Real-time Inline Input Field */}
        <div className="relative flex items-center bg-background border border-border rounded-xl px-3 py-2 w-full sm:flex-1 max-w-md shadow-inner">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search customer names, logs or IDs..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full min-w-0"
          />
        </div>

        {/* Dropdown State Selector Node */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary shadow-3xs"
          >
            <option value="ALL">{"All Assignments"}</option>
            <option value="CONFIRMED">{"Confirmed"}</option>
            <option value="PENDING">{"Pending"}</option>
            <option value="COMPLETED">{"Completed"}</option>
          </select>
        </div>
      </div>

      {/* Main Grid View Layer */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/50">
          <CalendarCheck2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">
            {
              "No personal appointments matched your active query filter limits."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full min-w-0">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="relative flex flex-col justify-between p-5 border border-border bg-card rounded-2xl shadow-3xs min-w-0 group hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-4 w-full min-w-0">
                {/* Client Information Header Block */}
                <div className="flex items-start gap-3 border-b border-border/60 pb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {booking.user?.firstName} {booking.user?.lastName}
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {booking.user?.email}
                    </p>
                  </div>
                </div>

                {/* Scheduling Parameters Meta Area */}
                <div className="space-y-2 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-foreground">
                      {new Date(
                        booking.startTime || booking.createdAt,
                      ).toLocaleDateString("en-NG", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{"In-Store Workspace Station"}</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator Badging Metrics */}
              <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between gap-4 w-full">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                    booking.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : booking.status === "CONFIRMED"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {booking.status}
                </span>
                <span className="font-mono text-xs font-black text-foreground">
                  {"₦"}
                  {(booking.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
