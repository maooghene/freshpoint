"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CreditCardIcon, BanknoteIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner"; // Modern, fast alternative to react-toastify
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SummaryItem {
  id: string;
  name: string;
  price: number;
  duration: number | null;
}

interface BookingSummaryProps {
  totalPrice: number;
  items: SummaryItem[];
  onSuccess?: (details: unknown) => void;
}

interface PayPalButtonStyle {
  layout: "vertical" | "horizontal";
  color: "blue" | "gold" | "silver" | "white" | "black";
  shape: "rect" | "pill";
  label: "pay" | "paypal" | "buynow" | "checkout";
  height: number;
}

const BookingSummary = ({
  totalPrice,
  items,
  onSuccess,
}: BookingSummaryProps) => {
  const currency = "₦";
  const router = useRouter();

  // State Management - Rebranded context to Pay at Venue for general wellness operations
  const [paymentMethod, setPaymentMethod] = useState<"PAY_AT_VENUE" | "PAYPAL">(
    "PAY_AT_VENUE",
  );

  // Explicitly typed configuration parameters matching strict SDK bounds
  const paypalButtonStyles: PayPalButtonStyle = {
    layout: "vertical",
    color: "blue",
    shape: "rect",
    label: "pay",
    height: 45,
  };

  const handleLocalConfirmation = () => {
    // Generate a secure offline reference fallback
    const offlineRef = `FP-OFF-${Math.floor(100000 + Math.random() * 900000)}`;
    router.push(`/bookings/success?reference=${offlineRef}`);
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl relative z-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
          Booking Summary
        </h2>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-wider">
          Step 2 of 2
        </span>
      </div>

      {/* PAYMENT METHOD METHODOLOGY SELECTOR */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Choose Payment
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* VENUE TRANSACTION SELECTION */}
          <button
            type="button"
            onClick={() => setPaymentMethod("PAY_AT_VENUE")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
              paymentMethod === "PAY_AT_VENUE"
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <BanknoteIcon size={22} />
            <span className="text-[11px] font-bold">Pay at Venue</span>
          </button>

          {/* ESCROW INTENT SELECTION */}
          <button
            type="button"
            onClick={() => setPaymentMethod("PAYPAL")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
              paymentMethod === "PAYPAL"
                ? "border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba] ring-1 ring-[#0070ba]/20"
                : "border-border bg-muted/20 text-muted-foreground hover:border-[#0070ba]/40"
            }`}
          >
            <CreditCardIcon size={22} />
            <span className="text-[11px] font-bold">PayPal</span>
          </button>
        </div>
      </div>

      <Separator className="my-6 bg-border" />

      {/* PRICE BREAKDOWN SCHEMATICS */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted-foreground">Session Subtotal</span>
          <span className="text-foreground">
            {currency}
            {totalPrice.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted-foreground">Platform Booking Fee</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            Free
          </span>
        </div>
      </div>

      {/* SECURE CHECKOUT AGGREGATE MATRICES */}
      <div className="flex justify-between items-end mb-8 pt-4 border-t border-border">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">
            Total Amount
          </span>
          <span className="text-3xl font-black text-foreground tracking-tight">
            {currency}
            {totalPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
          <ShieldCheckIcon size={12} />
          SECURE
        </div>
      </div>

      {/* PAYPAL COMPILING SCRIPT ENGINE */}
      <div className="relative z-0">
        {paymentMethod === "PAYPAL" ? (
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
              currency: "USD",
              intent: "capture",
            }}
          >
            <PayPalButtons
              style={paypalButtonStyles}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        value: totalPrice.toString(),
                        currency_code: "USD",
                      },
                      description: `Freshpoint Wellness Booking - ${items.length} Treatments`,
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                const details = await actions.order?.capture();
                toast.success("Payment Captured Successfully!");
                if (onSuccess) onSuccess(details);

                const captureId = details?.id || "FP-PAY-SUCCESS";
                router.push(`/bookings/success?reference=${captureId}`);
              }}
              onError={(err) => {
                toast.error("PayPal processing failed. Try again.");
                console.error("PAYPAL DISPATCH CRITICAL ERROR:", err);
              }}
            />
          </PayPalScriptProvider>
        ) : (
          <Button
            onClick={handleLocalConfirmation}
            size="lg"
            className="w-full py-7 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Confirm & Pay at Venue
          </Button>
        )}
      </div>

      {/* WORKSPACE LEGAL RULES CAPTION */}
      <p className="text-[10px] text-center text-muted-foreground mt-6 leading-relaxed">
        By confirming, you agree to our structural 12-hour vendor cancellation
        policy. <br />
        No-shows may result in automatic tenant booking restrictions.
      </p>
    </div>
  );
};

export default BookingSummary;
