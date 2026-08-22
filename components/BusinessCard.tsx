"use client";

import { StarIcon, MapPinIcon, Sparkles, CheckCircle2Icon } from "lucide-react";
import {
  getBusinessAverageRating,
  getBusinessReviewCount,
} from "@/lib/reviewUtils";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    image: string | null;
    address: string;
    categories: string[];
    isActive: boolean;
  };
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  const avgRating = getBusinessAverageRating(business.id);
  const reviewCount = getBusinessReviewCount(business.id);

  return (
    <div className="group block w-full max-w-[320px] mx-auto cursor-pointer">
      <div className="relative bg-muted/40 aspect-video rounded-[2.5rem] overflow-hidden border border-border transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/5">
        <ImageWithFallback
          src={business.image}
          alt={business.name}
          icon={Sparkles}
          label="Wellness Space"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {business.isActive && (
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 shadow-xs">
            <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Open Now
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3 px-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest truncate">
              {business.categories?.[0] || "Wellness Space"}
            </p>

            <h3 className="font-black text-foreground tracking-tight text-xl leading-none truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20 shrink-0">
            <StarIcon size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              {avgRating > 0 ? avgRating : "New"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
            <MapPinIcon size={14} className="text-primary/60 shrink-0" />
            <span className="truncate">{business.address}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon size={12} className="shrink-0" />
            <span>
              {reviewCount > 0
                ? `${reviewCount} ${reviewCount === 1 ? "REVIEW" : "REVIEWS"}`
                : "REAL-TIME APPOINTMENTS ACTIVE"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
