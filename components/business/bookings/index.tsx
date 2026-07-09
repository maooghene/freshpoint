"use client";

import { useEffect, useState, useCallback } from "react";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import { Booking, BookingStatus } from "./types";
import BookingTable from "./BookingTable";
import { X, QrCode, Phone, Mail } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface FreshpointBookingsDashboardProps {
  businessSlug: string;
}

export default function FreshpointBookingsDashboard({
  businessSlug,
}: FreshpointBookingsDashboardProps) {
  const { isLoaded: authLoaded } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchBookingsData = useCallback(
    async (slug: string, isMounted: boolean) => {
      try {
        // Enforce cookie passage across client boundary using the plural endpoint structure
        const res = await fetch(`/api/businesses/bookings?slug=${slug}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Safe status evaluation to prevent HTML payload parse crashes
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error(
              `Server returned HTML error response page (${res.status}). Verify authentication state.`,
            );
          }
          const errPayload = await res.json();
          throw new Error(errPayload.error || "Failed to fetch bookings");
        }

        const data = await res.json();

        if (isMounted) {
          const bookingsArray: Booking[] = data.bookings || [];
          setBookings(bookingsArray);

          setSelectedBooking((prev: Booking | null) => {
            if (!prev) return null;
            return bookingsArray.find((b: Booking) => b.id === prev.id) || prev;
          });
        }
      } catch (error: unknown) {
        console.error("Bookings component fetch error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch bookings",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [], // Absolute loop isolation for React 19 safety rules
  );

  useEffect(() => {
    if (!businessSlug || !authLoaded) return;
    let isMounted = true;

    const timer = setTimeout(() => {
      void fetchBookingsData(businessSlug, isMounted);
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [businessSlug, authLoaded, fetchBookingsData]);

  const updateBookingStatus = async (
    bookingId: string,
    status: BookingStatus,
  ): Promise<void> => {
    try {
      // Synchronized endpoint to target your exact plural route
      const res = await fetch("/api/businesses/bookings", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BookingId: bookingId,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.message) {
          throw new Error(data.message);
        }
        throw new Error(data.error || "Failed to alter status");
      }

      setBookings((prev: Booking[]) =>
        prev.map((b: Booking) => (b.id === bookingId ? { ...b, status } : b)),
      );

      setSelectedBooking((prev: Booking | null) => {
        if (prev && prev.id === bookingId) {
          return { ...prev, status };
        }
        return prev;
      });

      toast.success(`Appointment status updated to ${status}!`);
    } catch (error: unknown) {
      console.error("Status alteration execution error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    }
  };

  if (!authLoaded || loading) return <Loading />;

  const clientName: string = selectedBooking?.user?.firstName
    ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName || ""}`.trim()
    : "Customer Profile";

  return (
    <div className="w-full flex flex-col space-y-6 h-[calc(100vh-140px)] relative overflow-hidden">
      <div className="flex flex-col gap-1 shrink-0 bg-background pb-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground whitespace-normal break-words leading-relaxed">
          Appointment{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bookings
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium whitespace-normal break-words leading-relaxed">
          Review and manage your daily operations, client agenda, and QR code
          check-ins.
        </p>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {bookings.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-primary/20 rounded-3xl bg-primary/5">
            <p className="text-muted-foreground font-medium whitespace-normal break-words leading-relaxed">
              No appointments scheduled yet.
            </p>
          </div>
        ) : (
          <BookingTable
            bookings={bookings}
            onUpdateStatus={updateBookingStatus}
            onRowClick={(booking: Booking) => {
              setSelectedBooking(booking);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300 ease-out z-10 text-foreground">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <QrCode className="size-5 text-primary shrink-0" />
                <h2 className="text-xl font-black tracking-tight truncate">
                  Appointment Details
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-xl text-muted-foreground cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 mb-6 shadow-inner">
              <div className="bg-background p-3 rounded-xl border border-primary/20 shadow-sm">
                <QrCode className="size-28 text-foreground" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Verification Pass Code
                </span>
                <div className="text-lg font-mono font-black text-primary tracking-widest mt-0.5 select-all bg-background px-4 py-1.5 rounded-lg border border-border">
                  {selectedBooking.queueCode || "NO-CODE-ASSIGNED"}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-[280px] whitespace-normal break-words leading-relaxed">
                Match this code string with the client{"'"}s mobile QR ticket to
                securely verify check-in attendance.
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Customer Info
                </h4>
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/40 space-y-2.5">
                  <div className="font-bold text-base text-foreground whitespace-normal break-words leading-relaxed">
                    {clientName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-0">
                    <Mail size={14} className="text-primary shrink-0" />
                    <span className="truncate">
                      {selectedBooking.user?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-0">
                    <Phone size={14} className="text-primary shrink-0" />
                    <span className="truncate">
                      {selectedBooking.user?.phone || "No phone added"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
