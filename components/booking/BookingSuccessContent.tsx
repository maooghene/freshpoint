// components/booking/BookingSuccessContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface SuccessBookingDetails {
  id: string;
  startTime: string;
  totalAmount: number | null;
  paymentStatus: string | null;
  business: {
    name: string;
  };
  item: {
    name: string;
  };
}

interface ApiErrorResponse {
  message: string;
}

export function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const reference = searchParams?.get("reference");

  const [bookingDetails, setBookingDetails] =
    useState<SuccessBookingDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfirmedBooking = async () => {
      if (!reference) return;

      try {
        setLoading(true);
        const token = await getToken();

        const res = await axios.get<SuccessBookingDetails>(
          `/api/bookings/reference/${reference}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setBookingDetails(res.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error("FAILED TO FETCH COMPLETED BOOKING RECORDS:", axiosError);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedBooking();
  }, [reference, getToken]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        {/* SUCCESS BADGE VECTOR */}
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your self-care appointment has been successfully reserved and
          verified.
        </p>

        {/* LOADING ANCHOR INDICATOR */}
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary size-6" />
          </div>
        )}

        {/* COMPREHENSIVE TRANSACTION CARD */}
        {!loading && bookingDetails && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left space-y-4 shadow-sm text-card-foreground">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                Provider Venue
              </p>
              <p className="font-semibold text-foreground text-sm">
                {bookingDetails.business.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                Treatment / Service
              </p>
              <p className="font-semibold text-foreground text-sm">
                {bookingDetails.item.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">
                Scheduled Block
              </p>
              <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                {new Date(bookingDetails.startTime).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        )}

        {/* REFERENCE FALLBACK STRIP */}
        {reference && !bookingDetails && !loading && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left shadow-sm text-card-foreground">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
              Transaction Reference
            </p>
            <p className="font-mono text-xs break-all text-foreground/90">
              {reference}
            </p>
          </div>
        )}

        {/* WORKSPACE NAVIGATION CONTROLS */}
        <div className="space-y-4">
          <Button
            asChild
            size="lg"
            className="w-full font-semibold rounded-xl shadow-sm bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            <Link href="/bookings">
              View My Appointments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/")}
            className="w-full font-semibold rounded-xl border border-border hover:bg-muted/40 text-foreground transition-colors cursor-pointer"
          >
            Return to Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}
