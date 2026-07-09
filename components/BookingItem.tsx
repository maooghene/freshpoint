"use client";

import Image from "next/image";
import {
  CalendarIcon,
  MapPinIcon,
  Sparkles,
  Ticket,
  History,
} from "lucide-react";
import { useState } from "react";
import Rating from "@/components/Rating";
import RatingModal from "@/components/RatingModal";
import { formatTimeAgo } from "@/lib/timeAgo"; // 🌟 Import your new utility helper

type BookingItemRelation = {
  id: string;
  price: number;
  item: {
    name: string;
    image: string | null;
    type: "SERVICE" | "PRODUCT";
  };
};

export interface FreshpointBooking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  startTime: string | Date;
  createdAt: string | Date; // 🌟 Formally mapped
  totalAmount: number | null;
  queueCode: string;
  isVerifiedByStaff: boolean;
  items: BookingItemRelation[];
  business: {
    id: string;
    name: string;
    address: string;
  };
  ratings?: { rating: number }[] | null;
}

export interface SelectionModalPayload {
  id: string;
  queueCode: string;
  startTime: string;
  totalAmount: number;
  status: string;
  isVerifiedByStaff: boolean;
  businessName: string;
  itemName: string;
}

type Props = {
  booking: FreshpointBooking;
  onSelectBooking: (selectedData: SelectionModalPayload) => void;
};

type RatingModalState = {
  bookingId: string;
  businessId: string;
};

export default function BookingItem({ booking, onSelectBooking }: Props) {
  const currency = "₦";
  const [ratingModal, setRatingModal] = useState<RatingModalState | null>(null);

  const isCompleted = booking.status === "COMPLETED";
  const primaryItem = booking.items[0]?.item;
  const itemsCount = booking.items?.length || 0;
  const activeRating = booking.ratings?.[0]?.rating;

  return (
    <>
      <tr
        onClick={() =>
          onSelectBooking({
            id: booking.id,
            queueCode: booking.queueCode || "FP-TBD",
            startTime:
              typeof booking.startTime === "string"
                ? booking.startTime
                : booking.startTime.toISOString(),
            totalAmount: booking.totalAmount || 0,
            status: booking.status,
            isVerifiedByStaff: booking.isVerifiedByStaff || false,
            businessName: booking.business?.name || "Storefront Workspace",
            itemName: primaryItem?.name || "Premium Wellness Asset",
          })
        }
        className="hover:bg-primary/5 cursor-pointer transition border-b border-border/50 bg-card/40"
      >
        {/* RESPONSIVE PRIMARY CELL */}
        <td className="px-6 py-6">
          <div className="flex gap-4 items-center">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
              <Image
                src={
                  primaryItem?.image && primaryItem.image.trim() !== ""
                    ? primaryItem.image
                    : "/placeholder.jpg"
                }
                alt={primaryItem?.name || "Wellness Service"}
                fill
                unoptimized={true} // CORRECTED: Bypasses Next.js proxy overhead to eliminate upstream 400 errors entirely
                className="object-cover"
              />
            </div>

            <div className="space-y-1">
              {/* Relative booking log time-stamp metadata badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-md w-fit">
                <History size={10} />
                <span>Booked {formatTimeAgo(booking.createdAt)}</span>
              </div>

              <p className="font-bold text-base text-foreground leading-tight pt-0.5">
                {primaryItem?.name || "Unnamed Treatment"}
                {itemsCount > 1 && (
                  <span className="text-xs font-semibold text-muted-foreground ml-1.5 bg-muted px-1.5 py-0.5 rounded">
                    +{itemsCount - 1} more
                  </span>
                )}
              </p>

              <p className="text-xs text-primary font-semibold flex items-center gap-1">
                <Sparkles size={12} className="shrink-0" />
                {booking.business.name}
              </p>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarIcon size={12} className="shrink-0" />
                Scheduled for: {new Date(booking.startTime).toDateString()}
              </p>

              {/* Mobile Extended Layout View Row Element */}
              <div className="flex flex-wrap items-center gap-2 pt-1 md:hidden">
                {/* FIXED: Added missing layout space between classes */}
                <span className="text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded">
                  {currency}
                  {(booking.totalAmount || 0).toLocaleString()}
                </span>
                <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <Ticket size={10} />
                  {booking.queueCode || "FP-TBD"}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* TOTAL AMOUNT PAID (HIDDEN ON MOBILE) */}
        <td className="text-center max-md:hidden px-6 font-bold text-foreground">
          {currency}
          {(booking.totalAmount || 0).toLocaleString()}
        </td>

        {/* LOCATION (HIDDEN ON MOBILE) */}
        <td className="max-md:hidden px-6">
          <p className="text-sm flex items-center gap-1 text-muted-foreground">
            <MapPinIcon size={12} className="shrink-0 text-primary" />
            <span className="truncate max-w-[200px]">
              {booking.business.address}
            </span>
          </p>
        </td>

        {/* STATUS & QUEUE CODE BADGES (HIDDEN ON MOBILE) */}
        <td className="max-md:hidden px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-wide bg-muted px-2 py-1 rounded-md text-foreground border border-border">
              {booking.status}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/10">
              {booking.queueCode || "FP-TBD"}
            </span>

            {isCompleted && !activeRating && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRatingModal({
                    bookingId: booking.id,
                    businessId: booking.business.id,
                  });
                }}
                className="text-primary text-xs font-bold cursor-pointer hover:underline"
              >
                Rate
              </button>
            )}
          </div>

          {activeRating && (
            <div className="mt-1.5">
              <Rating value={activeRating} size={12} />
            </div>
          )}
        </td>
      </tr>

      {ratingModal && (
        <RatingModal
          ratingModal={ratingModal}
          setRatingModal={setRatingModal}
        />
      )}
    </>
  );
}
