"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon, ChevronDown, ChevronUp, Box } from "lucide-react";
import { BusinessReviewList } from "@/components/BusinessReviewList";

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

export function ProductCatalogGrid({ products }: ProductCatalogGridProps) {
  const router = useRouter();
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});

  // 🌟 FIXED: Track which specific product IDs have broken images in real-time
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

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

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const resolveProductImage = (
    savedPath: string | null | undefined,
  ): string | null => {
    if (!savedPath || savedPath.trim().length === 0) {
      return null;
    }

    if (
      savedPath.startsWith("http://") ||
      savedPath.startsWith("https://") ||
      savedPath.includes("imagekit.io")
    ) {
      return savedPath;
    }

    const cleanToken = savedPath.replace(/^\//, "");
    return `https://imagekit.io{cleanToken}`;
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
        const displayImage = resolveProductImage(product.image);
        const isReviewsOpen = !!expandedReviews[product.id];

        // 🌟 FIXED: Check if the image path is null OR if it failed to load during the browser session
        const isImageBroken = !displayImage || !!brokenImages[product.id];

        return (
          <div
            key={product.id}
            onClick={() => router.push(`/products/${product.id}`)}
            className="cursor-pointer flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/20 transition-all duration-200 h-fit"
          >
            {/* Image Frame Section Container */}
            <div className="relative aspect-[4/3] w-full bg-muted border-b border-border/40 overflow-hidden flex items-center justify-center">
              {!isImageBroken && displayImage ? (
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  sizes="(max-w-7xl) 50vw"
                  className="object-cover group-hover:scale-103 transition-transform duration-300"
                  onError={() => handleImageError(product.id)} // 🌟 FIXED: Triggers immediately if ImageKit returns a 404
                />
              ) : (
                // Your beautiful, high-utility pure CSS backup box component
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary/40 p-2 text-center select-none animate-in fade-in duration-200">
                  <Box className="w-5 h-5 mb-1 text-primary/30" />
                  <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">
                    Wellness Item
                  </span>
                </div>
              )}
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
                {product.stock !== null && !isNaN(product.stock) && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      product.stock > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {product.stock > 0 ? "In Stock" : "OOS"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
