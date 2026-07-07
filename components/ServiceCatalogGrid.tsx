"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  CalendarCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessReviewList } from "@/components/BusinessReviewList";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  image: string | null;
}

interface ServiceCatalogGridProps {
  services: ServiceItem[];
}

export function ServiceCatalogGrid({ services }: ServiceCatalogGridProps) {
  const router = useRouter();
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});

  const toggleReviewsExpansion = (id: string) => {
    setExpandedReviews((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/30">
        <Sparkles className="mx-auto w-8 h-8 text-muted-foreground/40 mb-2" />
        <h3 className="text-sm font-bold text-foreground mb-0.5">
          No Services Listed Yet
        </h3>
        <p className="text-xs text-muted-foreground font-medium">
          This provider has not added any treatments or services yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service: ServiceItem) => {
        const isReviewsOpen = !!expandedReviews[service.id];
        const hasValidImage = service.image && service.image.trim().length > 0;

        return (
          <div
            key={service.id}
            className="flex flex-row md:flex-col bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/20 transition-all duration-200 p-3 gap-4 h-fit"
          >
            {/* Image Frame Section */}
            <div className="relative w-20 h-20 md:w-full md:aspect-video rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40 flex items-center justify-center">
              {hasValidImage ? (
                <Image
                  src={service.image as string}
                  alt={service.name}
                  fill
                  className="object-cover group-hover:scale-103 transition-transform duration-300"
                />
              ) : (
                // 🌟 FIXED: Pure CSS box background. No image files called, zero chance of a 404 server crash!
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary/40 p-2 text-center">
                  <Activity className="w-5 h-5 mb-1 text-primary/30" />
                  <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">
                    Treatment
                  </span>
                </div>
              )}
            </div>

            {/* Content Container Frame */}
            <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
              <div className="space-y-0.5">
                <h3 className="font-bold text-foreground text-sm tracking-tight truncate">
                  {service.name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 md:line-clamp-2 font-medium leading-normal">
                  {service.description ||
                    "No description provided for this treatment."}
                </p>
              </div>

              {/* Compact Review Panel */}
              <div className="border-t border-b border-border/40 py-1">
                <button
                  type="button"
                  onClick={() => toggleReviewsExpansion(service.id)}
                  className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <span>Reviews Panel</span>
                  {isReviewsOpen ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {isReviewsOpen && (
                  <div className="mt-1 transition-all duration-200">
                    <BusinessReviewList itemId={service.id} />
                  </div>
                )}
              </div>

              {/* Financial Rate Layout Line */}
              <div className="flex items-center justify-between pt-1">
                <p className="font-black text-foreground text-sm">
                  ₦{service.price.toLocaleString()}
                </p>
                {service.duration && (
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-semibold">
                    <ClockIcon className="w-3 h-3 shrink-0" />
                    {service.duration}m
                  </div>
                )}
              </div>

              <Button
                onClick={() => router.push(`/book/${service.id}`)}
                size="sm"
                className="w-full rounded-lg font-bold text-xs h-8 gap-1.5 cursor-pointer mt-1"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Book Now
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
