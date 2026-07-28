"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon, ChevronDown, ChevronUp, Box } from "lucide-react";
import { BusinessReviewList } from "@/components/BusinessReviewList";
import { ImageWithFallback } from "@/components/ImageWithFallback";

const LOW_STOCK_THRESHOLD = 5;

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  image: string | null;
}

interface ProductCatalogGridProps {
  products: ProductItem[];
}

function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null || isNaN(stock)) return null;

  if (stock <= 0) {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500">
        Out of Stock
      </span>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
        Only {stock} left
      </span>
    );
  }

  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      In Stock
    </span>
  );
}

export function ProductCatalogGrid({ products }: ProductCatalogGridProps) {
  const router = useRouter();

  // Added the opening parenthesis right here:
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});

  const toggleReviewsExpansion = (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    setExpandedReviews((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/30">
        <ShoppingBagIcon className="mx-auto w-8 h-8 text-muted-foreground/40 mb-2" />
        <h3 className="text-sm font-bold text-foreground mb-0.5">
          No Products Listed Yet
        </h3>
        <p className="text-xs text-muted-foreground font-medium">
          This provider has not added any products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product: ProductItem) => {
        const isReviewsOpen = !!expandedReviews[product.id];

        return (
          <div
            key={product.id}
            onClick={() => router.push(`/products/${product.id}`)}
            className="cursor-pointer flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/20 transition-all duration-200 h-fit"
          >
            <div className="relative aspect-[4/3] w-full bg-muted border-b border-border/40 overflow-hidden flex items-center justify-center">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                icon={Box}
                label="Wellness Item"
                sizes="(max-w-7xl) 50vw"
              />
            </div>

            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-bold text-foreground text-sm tracking-tight truncate">
                  {product.name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium leading-normal">
                  {product.description ||
                    "No description available for this product."}
                </p>
              </div>

              <div className="border-t border-b border-border/40 py-1">
                <button
                  type="button"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                    toggleReviewsExpansion(product.id, e)
                  }
                  className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <span>Feedback</span>
                  {isReviewsOpen ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {isReviewsOpen && (
                  <div
                    className="mt-1 transition-all duration-200"
                    onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                      e.stopPropagation()
                    }
                  >
                    <BusinessReviewList itemId={product.id} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <p className="font-black text-primary text-sm">
                  ₦{product.price.toLocaleString()}
                </p>
                <StockBadge stock={product.stock} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}