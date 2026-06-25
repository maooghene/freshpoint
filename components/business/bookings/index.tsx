// src/components/business/bookings/index.tsx
"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { Booking, BookingStatus } from "./types";
import BookingTable from "./BookingTable";

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

  const { getToken } = useAuth();

  useEffect(() => {
    if (!businessSlug) return;

    let isMounted = true;
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        // Appends businessSlug context dynamically to filter results at the database tier
        const { data } = await axios.get(
          `/api/business/bookings?slug=${businessSlug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (isMounted) {
          setBookings(data.bookings);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch bookings",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      isMounted = false;
    };
  }, [businessSlug, getToken]);

  const updateBookingStatus = async (
    bookingId: string,
    status: BookingStatus,
  ) => {
    const token = await getToken();

    // Injects businessSlug into authorization actions to ensure cross-tenant operations are blocked
    await axios.post(
      "/api/business/bookings",
      { bookingId, status, businessSlug },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Appointment{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bookings
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Review and manage your daily operations and client agenda.
        </p>
      </div>

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

      {/* Your Details Modal will fit right under here cleanly */}
    </div>
  );
}
