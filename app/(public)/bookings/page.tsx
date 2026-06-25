"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import BookingItem from "@/components/BookingItem";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

// Completely aligned with your multi-tenant Prisma Booking schema limits
type FreshpointBooking = {
  id: string;
  startTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  item: {
    name: string;
    price: number;
    image: string | null;
  };

  business: {
    id: string;
    name: string;
    address: string;
  };
};

export default function MyBookings() {
  const { user } = useUser();

  const [bookings, setBookings] = useState<FreshpointBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/bookings");

        if (!res.ok) throw new Error("Failed to fetch bookings");

        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("CRITICAL DATA FETCH FAILURE:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchBookings();
  }, [user]);

  return (
    <div className="relative min-h-screen pt-24 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {loading ? (
          /* LOADING RETRIEVAL HUB FRAME */
          <div className="h-[60vh] flex flex-col gap-3 items-center justify-center text-muted-foreground font-medium text-sm">
            <Loader2 className="animate-spin text-primary size-7" />
            <span>Loading appointments context...</span>
          </div>
        ) : bookings.length > 0 ? (
          <div className="my-6 space-y-10">
            {/* STYLISH DIRECT HEADER BLOCK Replacement for custom PageTitle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight">
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
                className="rounded-xl font-semibold"
              >
                <Link href="/explore">Book Another Session</Link>
              </Button>
            </div>

            {/* LIVE DATA GRID SCHEDULE TABLE */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-separate border-spacing-y-4 min-w-[600px]">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border">
                    <th className="text-left px-6 pb-2">
                      Treatment & Provider
                    </th>
                    <th className="text-center pb-2">Price Rate</th>
                    <th className="text-left px-6 pb-2">Scheduled Time</th>
                    <th className="text-left px-6 pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <BookingItem key={booking.id} booking={booking} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CLEAN CALENDAR FALLBACK WRAPPER */
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-5 text-primary">
              <CalendarIcon className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-2">
              No treatments yet
            </h2>
            <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
              Your self-care planner is empty. Discover top-rated spas, premium
              salons, and wellness spaces near you to get started.
            </p>

            <Button
              asChild
              size="lg"
              className="rounded-xl font-semibold px-8 shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/explore">Find a Wellness Space</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
