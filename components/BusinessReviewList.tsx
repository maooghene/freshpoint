"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { StarIcon, UserRound } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";


interface UserProfileMetadata {
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}

interface ReviewRecordShape {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: UserProfileMetadata;
}

interface ItemReviewProps {
  itemId: string;
  mode?: "ITEM" | "BUSINESS";
  // 🌟 GOAL 2 FIXED: Added the reactive refresh trigger key parameter to the structural props interface
  refreshKey?: number;
}

export function BusinessReviewList({
  itemId,
  mode = "ITEM",
  refreshKey = 0,
}: ItemReviewProps) {
  const isValidId =
    itemId && itemId !== "undefined" && itemId.trim().length > 0;

  const [reviews, setReviews] = useState<ReviewRecordShape[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(isValidId));

  useEffect(() => {
    if (!isValidId) return;

    let isMounted = true;
    const fetchItemReviews = async () => {
      try {
        const targetUrl =
          mode === "BUSINESS"
            ? `/api/ratings?businessId=${itemId}&mode=BUSINESS_ONLY`
            : `/api/ratings/item/${itemId}`;

        const response = await fetch(targetUrl, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = await response.json();

        if (isMounted && Array.isArray(data)) {
          setReviews(data);
        }
      } catch (error: unknown) {
        console.error("Failed to load catalog item reviews:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchItemReviews();
    return () => {
      isMounted = false;
    };
    // 🌟 GOAL 2 FIXED: Added refreshKey to the useEffect hook tracker dependency list matrix array.
    // The millisecond a submit finishes, this hook re-triggers automatically!
  }, [itemId, isValidId, mode, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3 mt-4 animate-pulse">
        <div className="h-16 bg-muted rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 border-t border-border/40 pt-4">
      <h4 className="text-sm font-bold tracking-tight text-foreground/80">
        {mode === "BUSINESS"
          ? `Workspace & Service Quality Reviews (${reviews.length})`
          : `Item Quality & Performance Feedback (${reviews.length})`}
      </h4>

      {reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground font-medium italic pl-1">
          {mode === "BUSINESS"
            ? "No hospitality feedback written for this workspace yet."
            : "No feedback written for this option yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((item: ReviewRecordShape) => {
            const displayName =
              item.user.firstName || item.user.lastName
                ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                : "Verified Buyer";

            return (
              <div
                key={item.id}
                className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-2 text-xs animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted border">
                      <ImageWithFallback
                        src={item.user.image}
                        alt={displayName}
                        icon={UserRound}
                        label=""
                        sizes="24px"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-600 px-2 py-0.5 font-black rounded-md">
                    <StarIcon className="w-2.5 h-2.5 fill-current" />
                    {item.rating}
                  </div>
                </div>
                {item.review && (
                  <p className="text-muted-foreground font-medium leading-relaxed pl-8">
                    {'"'}
                    {item.review}
                    {'"'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
