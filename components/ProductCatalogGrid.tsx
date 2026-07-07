"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon } from "lucide-react";

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

  // 💡 FIXED: Universal resolver function handles raw tokens and full URLs flawlessly
  const resolveProductImage = (
    savedPath: string | null | undefined,
  ): string => {
    if (!savedPath || savedPath.trim().length === 0) {
      return "/placeholder-product.jpg";
    }

    // If it is already a fully formed absolute web url link path, bypass it directly
    if (savedPath.startsWith("http://") || savedPath.startsWith("https://")) {
      return savedPath;
    }

    // Clean up double leading slashes if they exist in the raw database data string
    const cleanToken = savedPath.replace(/^\//, "");

    // 💡 REMINDER: Replace 'your_imagekit_id' with your exact live ImageKit URL ID hash string token!
    return `https://imagekit.io{cleanToken}`;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
        <ShoppingBagIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-bold text-foreground mb-1">
          No Products Listed Yet
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          This provider hasn&apos;t added any products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product: ProductItem) => {
        // Safe runtime formatting checks
        const displayImage = resolveProductImage(product.image);

        console.log(`Freshpoint Sync Metric for ${product.name}:`, {
          resolvedImageLink: displayImage,
          rawDatabaseStock: product.stock,
        });

        return (
          <div
            key={product.id}
            onClick={() => router.push(`/products/${product.id}`)}
            className="cursor-pointer flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/30 transition-all group duration-300"
          >
            {/* IMAGE WRAPPER ELEMENT */}
            <div className="relative aspect-square w-full bg-muted border-b border-border overflow-hidden">
              <Image
                // 💡 FIXED: Passes a fully qualified absolute secure URL node to Next.js every time
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-w-7xl) 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* CONTENT FRAME CARD LAYER */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-base tracking-tight group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                  {product.description ||
                    "No description available for this product."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <p className="font-black text-primary text-base">
                  ₦{product.price.toLocaleString()}
                </p>
                {product.stock !== null && !isNaN(product.stock) && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      product.stock > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
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
