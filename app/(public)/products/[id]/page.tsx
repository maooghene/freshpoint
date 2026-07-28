"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch } from "@/lib/store"; // FIXED: Uses your central type-safe hook
import { addItemToCart } from "@/lib/features/cartSlice";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_POLL_INTERVAL_MS = 15000;

// Completely mapped against your unified Prisma Item model structure
interface FreshpointItemProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  businessId: string;
  stock: number | null;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<FreshpointItemProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  // Tracks whether this is the first load (shows spinner) vs a background
  // poll refresh (silent — no spinner flash while the user is browsing).
  const hasLoadedOnce = useRef(false);

  const productId = params?.id;

  const fetchProductDetails = useCallback(async () => {
    // 2. Return early if there is no ID
    if (!productId) return;

    try {
      if (!hasLoadedOnce.current) setLoading(true);

      // 3. Use the isolated variable here
      const res = await fetch(`/api/items/${productId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Product data unavailable");

      const data = await res.json();
      setProduct(data);

      setQty((currentQty) => {
        if (typeof data.stock === "number" && data.stock > 0) {
          return Math.min(currentQty, data.stock);
        }
        return currentQty;
      });
    } catch (err) {
      console.error("FAILED TO FETCH PRODUCT SPECIFICATIONS:", err);
      if (!hasLoadedOnce.current) setProduct(null);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, [productId]); //

  useEffect(() => {
    if (!params?.id) return;

    hasLoadedOnce.current = false;
    void fetchProductDetails();

    // Poll for live stock changes (restocks, other customers buying) without
    // requiring a full page reload. Simple interval — fits a Vercel
    // serverless app better than SSE/websockets for this scale.
    const intervalId = setInterval(() => {
      void fetchProductDetails();
    }, STOCK_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [params?.id, fetchProductDetails]);

  const isOutOfStock = product?.stock !== null && (product?.stock ?? 0) <= 0;
  const isAtMaxQty =
    product?.stock !== null && qty >= (product?.stock ?? Infinity);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    // FIXED: Formally aligns structure to clear multi-tenant slice payload expectations
    dispatch(
      addItemToCart({
        businessId: product.businessId,
        item: {
          id: `${product.id}-${Date.now()}`,
          itemId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          priceAtAdd: product.price,
          image: product.image || null, // ← add this
        },
      }),
    );

    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col gap-2 items-center justify-center text-muted-foreground font-medium text-sm">
        <Loader2 className="animate-spin text-primary size-7" />
        <span>Loading item spec sheets...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-xs mx-auto px-4 space-y-4">
        <p className="text-destructive font-medium">
          The requested wellness item could not be found.
        </p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-xl font-semibold w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pt-24 min-h-screen bg-background text-foreground">
      {/* HEADER GO BACK ROW NAVIGATION */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8 cursor-pointer group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Catalog
      </button>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* RETAIL PRODUCT DEEP PRESENTATION FRAME */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border bg-muted shadow-xs max-w-md mx-auto md:mx-0">
          <Image
            src={product.image || "/placeholder-product.jpg"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* COMPREHENSIVE TEXT METADATA SPECS */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-black text-primary">
              ₦{product.price.toLocaleString()}
            </p>
          </div>

          {/* STOCK STATUS INDICATOR */}
          {product.stock !== null && (
            <div>
              {product.stock <= 0 ? (
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500">
                  Out of Stock
                </span>
              ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Only {product.stock} left
                </span>
              ) : (
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  In Stock
                </span>
              )}
            </div>
          )}

          <div className="border-t border-b border-border py-4">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {product.description ||
                "No product summary details configured by vendor spaceprovider."}
            </p>
          </div>

          {/* HIGH-UTILITY QUANTITY STEP CONTROLLER CHIPS */}
          {!isOutOfStock && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Purchase Quantity
              </label>
              <div className="flex items-center gap-1 bg-muted/40 w-fit p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-9 w-9 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  disabled={qty <= 1}
                  aria-label="Decrease bundle size"
                >
                  <Minus size={14} />
                </button>

                <span className="w-12 text-center font-bold text-sm text-foreground">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQty((q) =>
                      product.stock !== null
                        ? Math.min(product.stock, q + 1)
                        : q + 1,
                    )
                  }
                  className="h-9 w-9 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isAtMaxQty}
                  aria-label="Increase bundle size"
                >
                  <Plus size={14} />
                </button>
              </div>
              {isAtMaxQty && (
                <p className="text-[11px] font-medium text-muted-foreground">
                  Max available quantity selected.
                </p>
              )}
            </div>
          )}

          {/* DISPATCH ACTION TRIGGER GATES */}
          <Button
            onClick={handleAddToCart}
            size="lg"
            disabled={isOutOfStock}
            className="w-full md:w-auto px-10 py-6 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-300 gap-2 cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="size-5" />
            {isOutOfStock ? "Out of Stock" : "Add item to Basket"}
          </Button>
        </div>
      </div>
    </div>
  );
}