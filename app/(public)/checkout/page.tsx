"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import PaystackBtn from "@/components/PaystackButton";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Sparkles,
  CreditCard,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// 1. Declare explicit type extension for the window global Paystack script runner
declare global {
  interface Window {
    PaystackPop?: unknown;
  }
}

interface SelectedService {
  id: string;
  name: string;
  price: number;
  duration: number;
  image: string | null;
}

interface LocalBookingState {
  businessId: string | null;
  businessName: string | null;
  selectedService: SelectedService | null;
  bookingTime: string | null;
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();

  // FIXED: Explicitly type slice shape to safely isolate from cyclic unknown fallbacks
  const booking = useSelector(
    (state: { booking: LocalBookingState }) => state.booking,
  );

  const service = booking.selectedService;
  const dateTime = booking.bookingTime;
  const businessName = booking.businessName || "Wellness Space";

  // Format Date & Time cleanly using regional Nigeria localized layout configurations
  const formattedDate = dateTime
    ? new Date(dateTime).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedTime = dateTime
    ? new Date(dateTime).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const totalAmount = service?.price || 0;

  const handlePaymentSuccess = async (reference: string) => {
    if (!userId) {
      alert("Please log in to complete your transaction.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          businessId: booking.businessId,
          itemId: service?.id,
          startTime: dateTime,
        }),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        // FIXED: Redirects cleanly onto Freshpoint's multi-tenant success shell routing
        router.push(`/bookings/success?reference=${reference}`);
      } else {
        alert(
          "Payment was successful, but your slot validation timed out. Please contact care support.",
        );
      }
    } catch (err) {
      console.error("CONFIRMATION REWRITING EXCEPTION:", err);
      alert("Transaction secured, but server confirmation dropped.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClose = () => {
    setLoading(false);
  };

  // Load Paystack dynamic script elements safely
  useEffect(() => {
    if (window.PaystackPop) return;

    const script = document.createElement("script");
    script.src = "https://paystack.co";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!service || !dateTime) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-6 bg-background text-foreground">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-destructive font-medium text-lg">
            No active session context data found.
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="rounded-xl font-semibold w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Selections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pt-24 min-h-screen bg-background text-foreground w-full">
      <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
        <CreditCard className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
      </div>

      {/* Booking Summary Card */}
      <div className="border border-border rounded-2xl p-6 mb-6 bg-card shadow-xs">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 tracking-tight">
          <Sparkles className="w-5 h-5 text-primary" />
          Treatment Summary
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Provider
            </span>
            <span className="font-bold text-foreground text-right tracking-tight">
              {businessName}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Service
            </span>
            <span className="font-bold text-foreground text-right tracking-tight">
              {service.name}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Price Rate
            </span>
            <span className="font-black text-primary text-lg">
              ₦{service.price.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Duration
            </span>
            <span className="font-semibold text-sm text-foreground bg-muted px-2.5 py-1 rounded-md">
              {service.duration} mins
            </span>
          </div>

          {formattedDate && (
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary/70" />
                Date
              </div>
              <span className="font-semibold text-sm text-foreground">
                {formattedDate}
              </span>
            </div>
          )}

          {formattedTime && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Clock className="w-4 h-4 text-primary/70" />
                Time Slot
              </div>
              <span className="font-semibold text-sm text-foreground">
                {formattedTime}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total Aggregation block */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-xs">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
            Total Amount
          </span>
          <span className="font-black text-2xl text-foreground tracking-tight">
            ₦{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Paystack Handler Button Gate */}
      <div className="relative">
        {loading ? (
          <Button
            disabled
            className="w-full py-6 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <Loader2 className="animate-spin h-5 w-5" />
            Securing Reservation...
          </Button>
        ) : (
          <PaystackBtn
            amount={totalAmount}
            email={
              user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"
            }
            name={user?.fullName || businessName}
            metadata={{
              itemId: service.id,
              dateTime: dateTime,
              businessId: booking.businessId,
              userId: userId,
            }}
            onSuccess={handlePaymentSuccess}
            onClose={handlePaymentClose}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
        Secured encrypted by Paystack • Your appointment will be confirmed
        instantly within your dynamic dashboard logs.
      </p>
    </div>
  );
}
