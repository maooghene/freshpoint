"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  ShieldAlert,
  Calendar,
  Clock,
  Receipt,
  QrCode,
} from "lucide-react";
import { Button } from "./ui/button";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    id: string;
    queueCode: string;
    startTime: string;
    totalAmount: number;
    status: string;
    isVerifiedByStaff: boolean;
    businessName: string;
    itemName: string;
  };
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  bookingData,
}: BookingDetailsModalProps) {
  const [isVerified, setIsVerified] = useState(bookingData.isVerifiedByStaff);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Provider-side verification pipeline simulation handler
  const handleStaffVerificationToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingData.id }),
      });
      if (res.ok) {
        setIsVerified(true);
      }
    } catch (err) {
      console.error("Verification adjustment exception caught:", err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(bookingData.startTime).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
    },
  );

  const formattedTime = new Date(bookingData.startTime).toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border max-w-sm w-full rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Header Section */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="text-center pb-4 border-b border-muted/60">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {bookingData.businessName}
          </p>
          <h2 className="text-xl font-bold mt-1 text-foreground">
            {bookingData.itemName}
          </h2>
        </div>

        {/* 🎫 BIG SUB-VISUAL QUEUE CODE IDENTIFICATION CARD CONTAINER */}
        <div className="my-6 p-4 rounded-xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-muted-foreground mb-1">
            Check-in Sequence Pass
          </span>
          <h3 className="text-4xl font-extrabold tracking-wider font-mono text-primary animate-pulse">
            {bookingData.queueCode || "FP-TBD"}
          </h3>

          {/* Simulated QR placeholder icon layer acting as anchor link framework */}
          <div className="mt-3 p-2 bg-white rounded-lg border border-border/40">
            <QrCode className="size-20 text-slate-900 stroke-[1.5]" />
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs font-medium">
            {isVerified ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle className="size-3.5 fill-emerald-500/10" /> Checked
                In & Confirmed
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1">
                <ShieldAlert className="size-3.5 animate-bounce" /> Awaiting
                Provider Scan
              </span>
            )}
          </div>
        </div>

        {/* Booking Parameters & Invoice Log */}
        <div className="space-y-3 text-sm border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-4" /> Date
            </span>
            <span className="font-semibold text-foreground">
              {formattedDate}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-4" /> Appointment Window
            </span>
            <span className="font-semibold text-foreground">
              {formattedTime}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 text-base font-bold text-foreground">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
              <Receipt className="size-4" /> Price Settled
            </span>
            <span>₦{(bookingData.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Options Grid Section */}
        <div className="space-y-2">
          {/* Simulated Business Portal Button: Allows provider to scan/verify client instantly */}
          {!isVerified && (
            <Button
              onClick={handleStaffVerificationToggle}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
            >
              {loading ? "Verifying..." : "Simulate Provider Scan"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl font-medium"
          >
            Dismiss Details
          </Button>
        </div>
      </div>
    </div>
  );
}
