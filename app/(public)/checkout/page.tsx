// app/(public)/checkout/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft, Loader2 } from "lucide-react";

// Import broken-down SOLID structures
import { TreatmentSummary } from "@/components/checkout/TreatmentSummary";
import { TotalAmountCard } from "@/components/checkout/TotalAmountCard";
import { PaymentSection } from "@/components/checkout/PaymentSection";

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
  const [hoursString, minutes] = timePart.split(":");
  let hours = hoursString;

  if (modifier === "AM" && hours === "12") {
    hours = "00";
  } else if (modifier === "PM" && hours !== "12") {
    hours = String(Number(hours) + 12).padStart(2, "0");
  }

  return `${hours}:${minutes}`;
};

// Kept exactly as a named internal implementation to avoid path drops
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();

  const itemId = searchParams?.get("itemId");
  const businessId = searchParams?.get("businessId");
  const date = searchParams?.get("date");
  const rawTime = searchParams?.get("time");
  
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
        alert("Payment successful but booking confirmation failed. Please contact support.");
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

      <TreatmentSummary item={item} formattedDate={formattedDate} decodedTime={decodedTime} />
      <TotalAmountCard price={Number(item.price)} />
      
      <PaymentSection 
        paying={paying}
        price={Number(item.price)}
        email={user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"}
        name={user?.fullName || item.business.name}
        metadata={{
          itemId: item.id,
          dateTime: dateTime,
          businessId: businessId,
          userId: userId ?? null,
        }}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaying(false)}
      />

      <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
        Secured encrypted by Paystack • Your appointment will be confirmed instantly.
      </p>
    </div>
  );
}

// Kept exactly matching your target destination URL path routing rules
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
