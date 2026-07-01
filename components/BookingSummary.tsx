"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCardIcon,
  ShieldCheckIcon,
  InfoIcon,
  CoinsIcon,
} from "lucide-react";
import { toast } from "sonner";
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
  userEmail?: string;
  subaccountCode?: string; // The salon's unique Paystack subaccount code
  onSuccess?: (reference: string) => void;
}

const BookingSummary = ({
  totalPrice,
  items,
  userEmail = "customer@freshpoint.app",
  subaccountCode,
  onSuccess,
}: BookingSummaryProps) => {
  const currency = "₦";
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // 💰 HIGH-YIELD MONETIZATION ENGINE (5% + ₦500 Layout)
  const COMMISSION_PERCENTAGE = 0.05; // 5% dynamic scale rate
  const FLAT_MARKUP = 500; // ₦500 baseline markup protection

  // Compute platform service fee dynamically
  const platformServiceCharge =
    totalPrice * COMMISSION_PERCENTAGE + FLAT_MARKUP;

  // Total payable amount shown directly to the user
  const totalPayableAmount = totalPrice + platformServiceCharge;

  // 🧮 AUTOMATED REVENUE OVERHEAD MANAGEMENT
  const calculatePaystackSplitSettings = () => {
    // Paystack standard network processing fees (1.5% + ₦100)
    const paystackBaseFee = totalPayableAmount * 0.015;
    const paystackFlatFee = 100;
    const totalPaystackDeduction = paystackBaseFee + paystackFlatFee;

    // Your transaction charge must pull both your service markup AND cover the payment processing fee
    // so that the salon vendor is paid exactly 100% of their base price.
    const amountToRetainForPlatform =
      platformServiceCharge + totalPaystackDeduction;

    return {
      totalKobo: Math.round(totalPayableAmount * 100),
      platformChargeKobo: Math.round(amountToRetainForPlatform * 100),
    };
  };

  const handlePaystackCheckout = async () => {
    setIsProcessing(true);

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();

      const { totalKobo, platformChargeKobo } =
        calculatePaystackSplitSettings();

      const transactionConfig: any = {
        key:
          process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
          "pk_test_your_key_here",
        email: userEmail,
        amount: totalKobo,
        currency: "NGN",
        ref: `FP-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        onSuccess: (transaction: { reference: string }) => {
          setIsProcessing(false);
          toast.success("Payment Cleared Successfully!");

          if (onSuccess) {
            onSuccess(transaction.reference);
          }

          router.push(`/bookings/success?reference=${transaction.reference}`);
        },
        onCancel: () => {
          setIsProcessing(false);
          toast.error(
            "Payment Cancelled. Upfront payment required to secure dates.",
          );
        },
      };

      // 🔄 DYNAMIC AUTOMATED SPLIT PAYMENT ROUTING
      if (subaccountCode) {
        transactionConfig.subaccount = subaccountCode;
        transactionConfig.transaction_charge = platformChargeKobo;
      }

      popup.newTransaction(transactionConfig);
    } catch (error) {
      console.error("PAYSTACK SYSTEM INITIALIZATION FAULT:", error);
      setIsProcessing(false);
      toast.error("Payment gateway is down. Please refresh and retry.");
    }
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

      {/* PAYSTACK CHANNEL BANNER */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Payment Processing Channel
        </p>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary bg-primary/10 text-primary ring-1 ring-primary/20">
          <CreditCardIcon size={22} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold">Paystack Secure Network</span>
            <span className="text-[10px] text-muted-foreground">
              Instant processing protection
            </span>
          </div>
        </div>
      </div>

      <Separator className="my-6 bg-border" />

      {/* BUNDLED USER CONVERSION PRICE BREAKDOWN */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted-foreground">Salon Session Cost</span>
          <span className="text-foreground font-semibold">
            {currency}
            {totalPrice.toLocaleString()}
          </span>
        </div>

        {/* 🚀 BUNDLED REVENUE AND PROCESSING MARGINS LINE ITEM */}
        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CoinsIcon size={14} className="text-primary shrink-0" />
            Transaction & Service Charge
          </span>
          <span className="text-foreground font-semibold">
            {currency}
            {platformServiceCharge.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* SECURITY AND NO-SHOW PROTECTION INFO BOX */}
      <div className="flex gap-2 text-[11px] text-muted-foreground bg-muted/50 border border-border/80 rounded-xl p-3 mb-6 items-start leading-relaxed">
        <InfoIcon size={14} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Booking Assurance Policy:</strong> Complete payment upfront to
          prevent no-shows and secure your specific calendar timeline.
        </span>
      </div>

      {/* FINAL TRANSACTION AGGREGATIONS */}
      <div className="flex justify-between items-end mb-8 pt-4 border-t border-border">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">
            Total Payable Due
          </span>
          <span className="text-3xl font-black text-foreground tracking-tight">
            {currency}
            {totalPayableAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
          <ShieldCheckIcon size={12} />
          SECURE
        </div>
      </div>

      {/* SUBMIT FIRE TRIGGERS */}
      <div className="relative z-0">
        <Button
          onClick={handlePaystackCheckout}
          disabled={isProcessing}
          size="lg"
          className="w-full py-7 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <span className="text-sm">Connecting Paystack Engine...</span>
          ) : (
            <>
              <CreditCardIcon size={20} />
              <span>Secure My Slot Now</span>
            </>
          )}
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground mt-6 leading-relaxed">
        By authorizing payment, you lock this calendar timeframe slot. <br />
        Freshpoint secure transactional clearing portal.
      </p>
    </div>
  );
};

export default BookingSummary;
