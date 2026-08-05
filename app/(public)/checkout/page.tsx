// app/(public)/checkout/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

import { TreatmentSummary } from "@/components/checkout/TreatmentSummary";
import { TotalAmountCard } from "@/components/checkout/TotalAmountCard";
import { PaymentSection } from "@/components/checkout/PaymentSection";
import { CheckoutContactField } from "@/components/checkout/CheckoutContactField";
import { isValidNigerianPhone } from "@/components/checkout/CheckoutContactField";

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

// Shown when payment succeeded but the booking itself couldn't be confirmed.
interface BookingFailureState {
  message: string;
  refunded: boolean | null; // null = we don't know (e.g. network error before a response came back)
}

// Display-only: "14:30" -> "2:30 PM"
function formatTimeDisplay(time24: string): string {
  const [hourStr, minute] = time24.split(":");
  const hour = Number(hourStr);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${ampm}`;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();

  const itemId = searchParams?.get("itemId");
  const businessId = searchParams?.get("businessId");
  const date = searchParams?.get("date");
  const rawTime = searchParams?.get("time");

  const time24 = rawTime ? decodeURIComponent(rawTime) : null;
  const displayTime = time24 ? formatTimeDisplay(time24) : null;

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [bookingFailure, setBookingFailure] =
    useState<BookingFailureState | null>(null);

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

  // Background hook to pull last used contact choice
  useEffect(() => {
    if (!userId) return;

    fetch("/api/users/profile-phone")
      .then((res) => (res.ok ? res.json() : { phone: null }))
      .then((data) => {
        if (data.phone) {
          setCustomerPhone(data.phone);
        }
      })
      .catch((err) => console.error("Profile phone look-up failed:", err));
  }, [userId]);

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

    setBookingFailure(null);

    try {
      setPaying(true);
      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          businessId,
          itemId,
          date,
          time: time24,
          customerPhone: customerPhone.trim(), // Appended to payload
        }),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        router.push(`/bookings/success?reference=${reference}`);
        return;
      }

      // Booking was rejected server-side. `refunded` comes from the API —
      // true/false when the server attempted a refund, undefined for
      // failure paths (e.g. missing metadata) that never reached the
      // refund step because no charge-side action was needed.
      setBookingFailure({
        message: result.error || "This booking could not be confirmed.",
        refunded: typeof result.refunded === "boolean" ? result.refunded : null,
      });
    } catch (err) {
      console.error("CONFIRMATION ERROR:", err);
      // Network/parse failure — we genuinely don't know server-side outcome,
      // so don't claim a refund status we can't verify.
      setBookingFailure({
        message:
          "Your payment went through, but we couldn't confirm the booking due to a connection issue.",
        refunded: null,
      });
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

  if (!item || !date || !time24) {
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

  const isContactValid = isValidNigerianPhone(customerPhone);

  return (
    <div className="max-w-2xl mx-auto p-6 pt-24 min-h-screen bg-background text-foreground w-full">
      <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
        <CreditCard className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
      </div>

      <TreatmentSummary
        item={item}
        formattedDate={formattedDate}
        decodedTime={displayTime}
      />
      <TotalAmountCard price={Number(item.price)} />

      {/* Embedded WhatsApp/Emergency Input Box Field */}
      <div className="my-6">
        <CheckoutContactField
          value={customerPhone}
          onChange={setCustomerPhone}
          variant="booking"
        />
      </div>

      {bookingFailure && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">
              {bookingFailure.message}
            </p>
            {bookingFailure.refunded === true && (
              <p className="text-xs text-muted-foreground">
                Your payment has been automatically refunded. It may take a few
                business days to reflect, depending on your bank.
              </p>
            )}
            {bookingFailure.refunded === false && (
              <p className="text-xs font-medium text-destructive">
                We were unable to process an automatic refund. Please contact
                support with your payment reference so we can resolve this
                manually.
              </p>
            )}
            {bookingFailure.refunded === null && (
              <p className="text-xs text-muted-foreground">
                If you were charged, please contact support with your payment
                reference so we can confirm the status of your refund.
              </p>
            )}
          </div>
        </div>
      )}

      {isContactValid ? (
        <PaymentSection
          paying={paying}
          price={Number(item.price)}
          email={
            user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"
          }
          name={user?.fullName || item.business.name}
          metadata={{
            itemId: item.id,
            date: date,
            time: time24,
            businessId: businessId,
            userId: userId ?? null,
          }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaying(false)}
        />
      ) : (
        <Button
          disabled
          className="w-full py-6 rounded-xl font-bold bg-muted text-muted-foreground opacity-60 flex items-center justify-center gap-2 cursor-not-allowed select-none"
        >
          Provide WhatsApp Contact to Pay
        </Button>
      )}

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
