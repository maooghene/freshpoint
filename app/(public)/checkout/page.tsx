"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
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

interface ItemDetails {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  business: {
    id: string;
    name: string;
  };
}

const convertTo24Hour = (time: string) => {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":");
  if (modifier === "PM" && hours !== "12") {
    hours = String(parseInt(hours) + 12);
  }
  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }
  return `${hours}:${minutes}`;
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();

  const itemId = searchParams.get("itemId");
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");
  const rawTime = searchParams.get("time");
  const decodedTime = rawTime ? decodeURIComponent(rawTime) : null;
  const time24 = decodedTime ? convertTo24Hour(decodedTime) : null;
  const dateTime = date && time24 ? `${date}T${time24}:00` : null;

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`);
        if (!res.ok) throw new Error("Item not found");
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error("Failed to fetch item:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const handlePaymentSuccess = async (reference: string) => {
    console.log("PAYMENT SUCCESS TRIGGERED, reference:", reference);

    if (!userId) {
      alert("Please log in to complete your transaction.");
      return;
    }

    try {
      setPaying(true);

      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          businessId,
          itemId,
          startTime: dateTime,
        }),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        router.push(`/bookings/success?reference=${reference}`);
      } else {
        alert(
          "Payment successful but booking confirmation failed. Please contact support.",
        );
      }
    } catch (err) {
      console.error("CONFIRMATION ERROR:", err);
      alert("Transaction secured, but server confirmation dropped.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary size-7" />
      </div>
    );
  }

  if (!item || !dateTime) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-6 bg-background text-foreground">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-destructive font-medium text-lg">
            Missing booking details. Please start again.
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="rounded-xl font-semibold w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
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
              {item.business.name}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Service
            </span>
            <span className="font-bold text-foreground text-right tracking-tight">
              {item.name}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Price Rate
            </span>
            <span className="font-black text-primary text-lg">
              ₦{Number(item.price).toLocaleString()}
            </span>
          </div>

          {item.duration && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground text-sm font-medium">
                Duration
              </span>
              <span className="font-semibold text-sm text-foreground bg-muted px-2.5 py-1 rounded-md">
                {item.duration} mins
              </span>
            </div>
          )}

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

          {decodedTime && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Clock className="w-4 h-4 text-primary/70" />
                Time Slot
              </div>
              <span className="font-semibold text-sm text-foreground">
                {decodedTime}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-xs">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
            Total Amount
          </span>
          <span className="font-black text-2xl text-foreground tracking-tight">
            ₦{Number(item.price).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Paystack Button */}
      <div className="relative">
        {paying ? (
          <Button
            disabled
            className="w-full py-6 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <Loader2 className="animate-spin h-5 w-5" />
            Securing Reservation...
          </Button>
        ) : (
          <PaystackBtn
            amount={Number(item.price)}
            email={
              user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"
            }
            name={user?.fullName || item.business.name}
            metadata={{
              itemId: item.id,
              dateTime: dateTime,
              businessId: businessId,
              userId: userId,
            }}
            onSuccess={handlePaymentSuccess}
            onClose={() => setPaying(false)}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
        Secured encrypted by Paystack • Your appointment will be confirmed
        instantly.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary size-7" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
