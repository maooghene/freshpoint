// components/checkout/BookingCheckoutContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { CreditCard, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import small sub-presenter segments safely
import { ItemDetails } from "./settings/types";
import { TreatmentSummaryCard } from "./settings/TreatmentSummaryCard";
import { TotalCard } from "./settings/TotalCard";
import { PaymentAction } from "./settings/PaymentAction";

const convertTo24Hour = (time: string) => {
  const [timePart, modifier] = time.split(" ");
  const [hoursString, minutes] = timePart.split(":");
  let hours = hoursString;

  if (modifier === "AM" && hours === "12") hours = "00";
  else if (modifier === "PM" && hours !== "12")
    hours = String(Number(hours) + 12).padStart(2, "0");

  return `${hours}:${minutes}`;
};

export function BookingCheckoutContent() {
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
    fetch(`/api/items/${itemId}`)
      .then((res) => res.json())
      .then((data) => setItem(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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
    if (!userId) return alert("Please log in to complete your transaction.");
    try {
      setPaying(true);
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          businessId,
          itemId,
          startTime: dateTime,
        }),
      });
      if (res.ok) router.push(`/bookings/success?reference=${reference}`);
      else alert("Booking confirmation dropped. Please contact support.");
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary size-7" />
      </div>
    );

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
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
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

      <TreatmentSummaryCard
        item={item}
        formattedDate={formattedDate}
        decodedTime={decodedTime}
      />
      <TotalCard price={item.price} />

      <PaymentAction
        paying={paying}
        price={item.price}
        email={
          user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"
        }
        name={user?.fullName || item.business.name}
        metadata={{
          itemId: item.id,
          dateTime: dateTime ?? undefined,
          businessId: businessId ?? undefined,
          userId: userId ?? undefined,
        }}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaying(false)}
      />

      <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
        Secured encrypted by Paystack • Your appointment will be confirmed
        instantly.
      </p>
    </div>
  );
}
