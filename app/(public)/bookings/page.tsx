// app/(public)/bookings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { LocalBookingTableData } from "@/components/booking/types";
import { BookingTableRow } from "@/components/booking/BookingTableRow";

export default function MyBookings() {
  const { user } = useUser();

  const [bookings, setBookings] = useState<LocalBookingTableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  const syncBookingsData = useCallback(async (isMounted: boolean) => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings records index.");
      const data = await res.json();

      if (isMounted) {
        setBookings(data);
      }
    } catch (err) {
      console.error("[DATA RETRIEVAL FAILURE] Core client sync dropped:", err);
      if (isMounted) {
        setBookings([]);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    syncBookingsData(isMounted);

    return () => {
      isMounted = false;
    };
  }, [user, syncBookingsData]);

  const handleModalClose = () => {
    setActiveBooking(null);
    setLoading(true);
    syncBookingsData(true);
  };

  return (
    <div className="relative min-h-screen pt-24 bg-background text-foreground">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full">
        {loading ? (
          <div className="h-[60vh] flex flex-col gap-3 items-center justify-center text-muted-foreground font-medium text-sm">
            <Loader2 className="animate-spin text-primary h-7 w-7" />
            <span>Loading appointments context...</span>
          </div>
        ) : bookings.length > 0 ? (
          <div className="my-6 space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  My Bookings
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  You have {bookings.length} active appointment
                  {bookings.length === 1 ? "" : "s"} scheduled.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-xl font-semibold border-border bg-card/50 text-foreground hover:bg-muted cursor-pointer"
              >
                <Link href="/explore">Book Another Session</Link>
              </Button>
            </div>

            {/* Bounded Grid Mesh Table Container */}
            <div className="rounded-xl border border-border overflow-hidden table-mesh bg-card w-full overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                {/* 🌟 FIXED: Formatted 7 exact header cells to map across the data rows cleanly */}
                <thead className="bg-muted/50 border-b border-border select-none">
                  <tr>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4 w-[140px]">
                      Access Code
                    </th>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4">
                      Treatment Provider
                    </th>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4">
                      Lifecycle Timeline
                    </th>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4 text-center">
                      Amount
                    </th>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4">
                      Fulfillment Mode
                    </th>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4">
                      Status
                    </th>
                    <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 py-4 text-right pr-12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((booking) => (
                    <BookingTableRow
                      key={booking.id}
                      booking={booking}
                      onSelect={setActiveBooking}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-5 text-primary">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
              No treatments yet
            </h2>
            <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
              Your self-care planner is empty. Discover top-rated spas, premium
              salons, and wellness spaces near you to get started.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-xl font-semibold px-8 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Link href="/explore">Find a Wellness Space</Link>
            </Button>
          </div>
        )}
      </div>

      {activeBooking && (
        <BookingDetailsModal
          isOpen={!!activeBooking}
          onClose={handleModalClose}
          bookingData={activeBooking}
        />
      )}
    </div>
  );
}
