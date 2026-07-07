"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import {
  MailIcon,
  MapPinIcon,
  StarIcon,
  MessageSquareIcon,
  PenLineIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BusinessReviewList } from "@/components/BusinessReviewList";
import BusinessReviewForm from "@/components/BusinessReviewForm";
import { useUser } from "@clerk/nextjs";

interface BusinessHeaderProps {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  rating: number | string;
  reviewCount: number;
  categories: string[] | null;
  address: string;
  email: string;
}

export function BusinessProfileHeader({
  id,
  name,
  image,
  description,
  rating,
  reviewCount,
  categories,
  address,
  email,
}: BusinessHeaderProps) {
  const { user } = useUser();
  const [showVenueReviews, setShowVenueReviews] = useState<boolean>(false);
  const [showWriteForm, setShowWriteForm] = useState<boolean>(false);

  // 🌟 GOAL 2 FIXED: Real-time cache-busting state key to force the reviews list to pull fresh data
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleFormSuccess = () => {
    setShowWriteForm(false);
    // Increment the key to trigger an immediate, seamless database re-fetch on the list component
    setRefreshKey((prev: number) => prev + 1);
    setShowVenueReviews(true);
  };

  return (
    <div className="space-y-6 mb-16">
      {/* ── CORE VENUE OVERLAY CARD ── */}
      <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-xl">
        <div className="relative shrink-0 w-44 h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden border border-border bg-muted">
          <Image
            src={image || "/placeholder-business.jpg"}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="text-center md:text-left flex-1 space-y-4 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground truncate">
              {name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-3 flex items-center gap-1">
                <StarIcon className="w-3 h-3 fill-current" />
                {rating} ({reviewCount} reviews)
              </Badge>

              <Button
                type="button"
                onClick={() => setShowVenueReviews(!showVenueReviews)}
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-bold gap-1 rounded-md px-2.5 bg-background border-border text-foreground hover:bg-muted cursor-pointer"
              >
                <MessageSquareIcon className="w-3 h-3" />
                {showVenueReviews ? "Close Wall" : "Read Venue Reviews"}
              </Button>

              {user && (
                <Button
                  type="button"
                  onClick={() => setShowWriteForm(true)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] font-bold gap-1 rounded-md px-2.5 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <PenLineIcon className="w-3 h-3" />
                  {"Write Venue Review"}
                </Button>
              )}
            </div>
          </div>

          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm">
            {description ||
              "No description configured yet for this wellness venue."}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
            {categories && categories.length > 0 ? (
              categories.map((category, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-[11px] font-semibold px-2.5 rounded-md"
                >
                  {category}
                </Badge>
              ))
            ) : (
              <Badge
                variant="outline"
                className="text-[11px] font-semibold px-2.5 text-muted-foreground border-dashed"
              >
                {"General Provider"}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 pt-4 border-t border-border">
            <div className="flex items-center text-xs font-bold text-muted-foreground">
              <MapPinIcon className="w-4 h-4 text-primary mr-1.5 shrink-0" />
              <span className="text-foreground/90 truncate">{address}</span>
            </div>
            <div className="flex items-center text-xs font-bold text-muted-foreground">
              <MailIcon className="w-4 h-4 text-primary mr-1.5 shrink-0" />
              <span className="text-foreground/90 truncate">{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 🌟 GOAL 1 FIXED: LAUNCHES AS A MODAL INTENT WITH AN ESCAPE HANDLER ── */}
      {showWriteForm && (
        <BusinessReviewForm
          businessId={id}
          businessName={name}
          onSuccess={handleFormSuccess}
          onClose={() => setShowWriteForm(false)}
        />
      )}

      {/* ── PUBLIC TIMELINE REVIEWS WALL ── */}
      {showVenueReviews && (
        <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-3xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200 relative">
          <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                <StarIcon className="w-4 h-4 text-emerald-500 fill-current" />
                {"Venue Hospitality Quality Wall"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {
                  "Overall workspace evaluations submitted directly by verified patrons."
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowVenueReviews(false)}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* 🌟 GOAL 2 FIXED: Passed refreshKey into the list component layer */}
          <BusinessReviewList
            itemId={id}
            mode="BUSINESS"
            refreshKey={refreshKey}
          />
        </div>
      )}
    </div>
  );
}
