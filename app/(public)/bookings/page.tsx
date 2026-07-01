"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import BookingItem, {
  FreshpointBooking,
  SelectionModalPayload,
} from "@/components/BookingItem";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function MyBookings() {
  const { user } = useUser();

  const [bookings, setBookings] = useState<FreshpointBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] =
    useState<SelectionModalPayload | null>(null);

  // 🌟 FIXED: Moved the state orchestration logic entirely inside the effect block
  // This ensures state transitions execute strictly asynchronously following network completions
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function executeDataFetch() {
      try {
        const res = await fetch("/api/bookings");
        if (!res.ok) throw new Error("Failed to fetch bookings");
        const data = await res.json();

        if (isMounted) {
          setBookings(data);
        }
      } catch (err) {
        console.error("CRITICAL DATA FETCH FAILURE:", err);
        if (isMounted) {
          setBookings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    executeDataFetch();

    // Clean up to prevent execution on unmounted component trees
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle post-modal interactions cleanly
  const handleModalClose = () => {
    setActiveBooking(null);
    setLoading(true);

    // Independent single fetch update execution
    fetch("/api/bookings")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <div className="relative min-h-screen pt-24 bg-background text-foreground">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full">
        {loading ? (
          <div className="h-[60vh] flex flex-col gap-3 items-center justify-center text-muted-foreground font-medium text-sm">
            <Loader2 className="animate-spin text-primary size-7" />
            <span>Loading appointments context...</span>
          </div>
        ) : bookings.length > 0 ? (
          <div className="my-6 space-y-10">
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
                className="rounded-xl font-semibold border-border bg-card/50 text-foreground hover:bg-muted"
              >
                <Link href="/explore">Book Another Session</Link>
              </Button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-separate border-spacing-y-4 min-w-[700px]">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border">
                    <th className="text-left px-6 pb-2">
                      Treatment & Provider
                    </th>
                    <th className="text-center pb-2 px-6">Total Amount</th>
                    <th className="text-left px-6 pb-2">Venue Location</th>
                    <th className="text-left px-6 pb-2">Status & Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <BookingItem
                      key={booking.id}
                      booking={booking}
                      onSelectBooking={setActiveBooking}
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
