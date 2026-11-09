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
  originalPrice?: number | null;
  stock: number | null;
  image: string | null;
}

interface ProductCatalogGridProps {
  products: ProductItem[];
}

/**
 * Jumia-style product tiles: square picture with a red "-20%" badge, two-line
 * name, bold price with the old price struck through, and a stock hint.
 * Two columns on phones; the whole tile is the tap target.
 */
export function ProductCatalogGrid({ products }: ProductCatalogGridProps) {
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 items-start">
      {products.map((product) => {
        const isReviewsOpen = !!expandedReviews[product.id];
        const outOfStock = product.stock !== null && product.stock <= 0;
        const lowStock =
          product.stock !== null &&
          product.stock > 0 &&
          product.stock <= LOW_STOCK_THRESHOLD;
        const discount =
          typeof product.originalPrice === "number" &&
          product.originalPrice > product.price
            ? Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100,
              )
            : null;

        return (
          <div
            key={product.id}
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/products/${product.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(`/products/${product.id}`);
            }}
            className="group cursor-pointer flex flex-col overflow-hidden rounded-xl border border-border bg-card active:scale-[0.985] transition-all duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                icon={Box}
                label="Product"
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                  outOfStock ? "opacity-50 grayscale" : ""
                }`}
              />
              {discount !== null && !outOfStock && (
                <span className="absolute right-1.5 top-1.5 rounded-md bg-destructive px-1.5 py-0.5 text-[11px] font-black text-white shadow-sm">
                  -{discount}%
                </span>
              )}
              {outOfStock && (
                <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-white">
                  Out of stock
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3">
              <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-medium leading-snug text-foreground">
                {product.name}
              </h3>

              <div className="flex flex-col">
                <span className="text-[15px] font-black leading-tight text-foreground sm:text-base">
                  ₦{product.price.toLocaleString()}
                </span>
                {discount !== null && (
                  <span className="text-xs font-medium text-muted-foreground line-through">
                    ₦{product.originalPrice?.toLocaleString()}
                  </span>
                )}
              </div>

              {lowStock && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Only {product.stock} left
                </span>
              )}

              <button
                type="button"
                onClick={(e) => toggleReviewsExpansion(product.id, e)}
                className="mt-1 flex w-full items-center justify-between border-t border-border/50 pt-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
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
                  className="cursor-default"
                  onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                    e.stopPropagation()
                  }
                >
                  <BusinessReviewList itemId={product.id} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
