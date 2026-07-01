"use client";

import { useEffect, useState, useCallback } from "react";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import { Booking, BookingStatus } from "./types";
import BookingTable from "./BookingTable";
import { X, QrCode, Phone, Mail, Clock, Calendar, FileText, CheckCircle2 } from "lucide-react";

interface FreshpointBookingsDashboardProps {
  businessSlug: string;
}

export default function FreshpointBookingsDashboard({
  businessSlug,
}: FreshpointBookingsDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBookingsData = useCallback(
    async (slug: string, isMounted: boolean) => {
      try {
        const res = await fetch(`/api/businesses/bookings?slug=${slug}`);

        if (!res.ok) {
          const errPayload = await res.json();
          throw new Error(errPayload.error || "Failed to fetch bookings");
        }

        const data = await res.json();

        if (isMounted) {
          setBookings(data.bookings || []);
          if (selectedBooking) {
            const updated = (data.bookings || []).find(
              (b: Booking) => b.id === selectedBooking.id,
            );
            if (updated) setSelectedBooking(updated);
          }
        }
      } catch (error) {
        console.error("Bookings component fetch error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch bookings",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [selectedBooking],
  );

  useEffect(() => {
    if (!businessSlug) return;
    let isMounted = true;

    const timer = setTimeout(() => {
      fetchBookingsData(businessSlug, isMounted);
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [businessSlug, fetchBookingsData]);

  const updateBookingStatus = async (
    bookingId: string,
    status: BookingStatus,
  ): Promise<void> => {
    try {
      const res = await fetch("/api/businesses/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          BookingId: bookingId,
          status,
          businessSlug,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to alter status");
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
      );

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status } : null));
      }

      toast.success(`Appointment status updated to ${status}!`);
    } catch (error) {
      console.error("Status alteration execution error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    }
  };

  if (loading) return <Loading />;

  const clientName = selectedBooking?.user?.firstName
    ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName || ""}`.trim()
    : "Customer Profile";

  return (
    <div className="w-full flex flex-col space-y-6 h-[calc(100vh-140px)] relative overflow-hidden">
      {/* SCROLL-LOCKED TITLE HEADER PANEL */}
      <div className="flex flex-col gap-1 shrink-0 bg-background pb-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Appointment{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bookings
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Review and manage your daily operations, client agenda, and QR code
          check-ins.
        </p>
      </div>

      {/* Main Table Screen Area */}
      <div className="flex-1 min-h-0 w-full">
        {bookings.length === 0 ? (
          <div className="p-20 text-center border border-dashed border-primary/20 rounded-3xl bg-primary/5">
            <p className="text-muted-foreground font-medium">
              No appointments scheduled yet.
            </p>
          </div>
        ) : (
          <BookingTable
            bookings={bookings}
            onUpdateStatus={updateBookingStatus}
            onRowClick={(booking) => {
              setSelectedBooking(booking);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      {/* ================= SLIDING DETAILS DRAWER PANEL WITH LIVE QR DATA ================= */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300 ease-out z-10 text-foreground">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-2">
                <QrCode className="size-5 text-primary" />
                <h2 className="text-xl font-black tracking-tight">
                  Appointment Details
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-xl text-muted-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR CODE CHECK-IN VERIFICATION WIDGET */}
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
              <p className="text-[11px] text-muted-foreground max-w-[280px]">
                Match this code string with the client&apos;s mobile QR ticket
                to securely verify check-in attendance.
              </p>
            </div>

            {/* CLIENT PROFILE DETAILS */}
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Customer Info
                </h4>
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/40 space-y-2.5">
                  <div className="font-bold text-base text-foreground">
                    {clientName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail size={14} className="text-primary shrink-0" />
                    <span className="truncate">
                      {selectedBooking.user?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={14} className="text-primary shrink-0" />
                    <span>
                      {selectedBooking.user?.phone || "No phone added"}
                    </span>
                  </div>
                </div>
              </div>

              {/* APPOINTMENT BOOKING TIME INFO */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Schedule & Treatment
                </h4>
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/40 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                      Selected Offering
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {selectedBooking.item?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase flex items-center gap-1">
                        <Calendar size={10} /> Date
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {new Date(selectedBooking.startTime).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase flex items-center gap-1">
                        <Clock size={10} /> Arrival Window
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {new Date(selectedBooking.startTime).toLocaleTimeString(
                          undefined,
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-1 flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground">
                      Service Fee Collected:
                    </span>
                    <span className="text-base font-black text-primary">
                      ₦{(selectedBooking.item?.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER INTAKE NOTES */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                  <FileText size={12} /> Client Booking Notes
                </h4>
                <div className="p-4 bg-secondary/20 rounded-xl border border-dashed text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;
                  {selectedBooking.notes ||
                    "No special requests or customization notes submitted for this visit."}
                  &rdquo;
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS BANNER ACCENT DROPDOWN */}
            <div className="border-t pt-4 mt-6 shrink-0 space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                Update Ticket Status
              </label>
              <div className="flex gap-2 w-full">
                <select
                  value={selectedBooking.status}
                  onChange={(e) =>
                    updateBookingStatus(
                      selectedBooking.id,
                      e.target.value as BookingStatus,
                    )
                  }
                  className="flex-1 bg-background border border-border text-foreground text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-primary transition-all cursor-pointer shadow-sm"
                >
                  <option value="PENDING">⏳ Mark Pending</option>
                  <option value="CONFIRMED">✅ Confirm Arrival</option>
                  <option value="COMPLETED">🏁 Check-out / Complete</option>
                  <option value="CANCELLED">❌ Revoke / Cancel</option>
                </select>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
