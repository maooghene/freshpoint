"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  CalendarCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { BusinessReviewList } from "@/components/BusinessReviewList";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  duration: number | null;
  image: string | null;
}

interface ServiceCatalogGridProps {
  services: ServiceItem[];
}

/**
 * Glovo-menu-style service rows: a roomy photo on the left, name, short
 * description and duration in the middle, price and a "Book" button on the
 * right. One full-width row per service on phones, two columns from tablet up.
 */
export function ServiceCatalogGrid({ services }: ServiceCatalogGridProps) {
  const router = useRouter();
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});

  const toggleReviewsExpansion = (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4 items-start">
      {services.map((service) => {
        const isReviewsOpen = !!expandedReviews[service.id];
        const discount =
          typeof service.originalPrice === "number" &&
          service.originalPrice > service.price
            ? Math.round(
                ((service.originalPrice - service.price) /
                  service.originalPrice) *
                  100,
              )
            : null;
        const open = () => router.push(`/book/${service.id}`);

        return (
          <div
            key={service.id}
            role="link"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter") open();
            }}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-2.5 sm:p-3 active:scale-[0.99] transition-all duration-150 hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="flex gap-3">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
                <ImageWithFallback
                  src={service.image}
                  alt={service.name}
                  icon={Activity}
                  label="Service"
                  sizes="112px"
                />
                {discount !== null && (
                  <span className="absolute left-1 top-1 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground">
                  {service.name}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-muted-foreground">
                  {service.description ||
                    "No description provided for this service."}
                </p>

                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-base font-black leading-tight text-foreground">
                      ₦{service.price.toLocaleString()}
                    </span>
                    {discount !== null && (
                      <span className="text-xs font-medium text-muted-foreground line-through">
                        ₦{service.originalPrice?.toLocaleString()}
                      </span>
                    )}
                    {service.duration && (
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <ClockIcon className="h-3 w-3 shrink-0" />
                        {service.duration} min
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm active:scale-95 transition-transform cursor-pointer"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Book
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => toggleReviewsExpansion(service.id, e)}
              className="mt-2 flex w-full items-center justify-between border-t border-border/50 pt-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span>Reviews</span>
              {isReviewsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {isReviewsOpen && (
              <div
                className="mt-1 cursor-default"
                onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                  e.stopPropagation()
                }
              >
                <BusinessReviewList itemId={service.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
