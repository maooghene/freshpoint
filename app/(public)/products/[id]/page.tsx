"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/lib/store";
import { addItemToCart } from "@/lib/features/cartSlice";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_POLL_INTERVAL_MS = 15000;

interface FreshpointItemVariant {
  id: string;
  size: string | null;
  color: string | null;
  price: number | null;
  stock: number;
}

interface FreshpointItemProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  businessId: string;
  stock: number | null;
  variants: FreshpointItemVariant[];
}

function variantLabel(v: FreshpointItemVariant): string {
  return [v.size, v.color].filter(Boolean).join(" / ") || "Option";
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<FreshpointItemProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  // Tracks whether this is the first load (shows spinner) vs a background
  // poll refresh (silent — no spinner flash while the user is browsing).
  const hasLoadedOnce = useRef(false);

  const productId = params?.id;

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;

    try {
      if (!hasLoadedOnce.current) setLoading(true);

      const res = await fetch(`/api/items/${productId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Product data unavailable");

      const data = await res.json();
      setProduct(data);

      // Default to the first available variant once, on first load only —
      // don't clobber the user's active selection on background polls.
      if (
        !hasLoadedOnce.current &&
        Array.isArray(data.variants) &&
        data.variants.length > 0
      ) {
        const firstInStock =
          data.variants.find((v: FreshpointItemVariant) => v.stock > 0) ||
          data.variants[0];
        setSelectedVariantId(firstInStock.id);
      }

      setQty((currentQty) => {
        const stockCeiling =
          Array.isArray(data.variants) && data.variants.length > 0
            ? undefined // resolved below once selectedVariant is known
            : data.stock;
        if (typeof stockCeiling === "number" && stockCeiling > 0) {
          return Math.min(currentQty, stockCeiling);
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
  }, [productId]);

  useEffect(() => {
    if (!params?.id) return;

    hasLoadedOnce.current = false;
    void fetchProductDetails();

    const intervalId = setInterval(() => {
      void fetchProductDetails();
    }, STOCK_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [params?.id, fetchProductDetails]);

  const hasVariants = !!product && product.variants.length > 0;
  const selectedVariant =
    hasVariants && product
      ? (product.variants.find((v) => v.id === selectedVariantId) ?? null)
      : null;

  // Effective price/stock: falls back to base product values when there
  // are no variants, or when a variant's price override is null.
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
  const effectiveStock = hasVariants
    ? (selectedVariant?.stock ?? 0)
    : (product?.stock ?? null);

  const isOutOfStock = hasVariants
    ? !selectedVariant || selectedVariant.stock <= 0
    : product?.stock !== null && (product?.stock ?? 0) <= 0;

  const isAtMaxQty =
    typeof effectiveStock === "number" && effectiveStock !== null
      ? qty >= effectiveStock
      : false;

  useEffect(() => {
    // Clamp quantity down whenever the selected variant changes to
    // something with less stock than the currently chosen qty.
    if (typeof effectiveStock === "number" && effectiveStock > 0) {
      setQty((q) => Math.min(q, effectiveStock));
    }
  }, [effectiveStock]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    if (hasVariants && !selectedVariant) {
      toast.error("Please select an option before adding to basket.");
      return;
    }

    dispatch(
      addItemToCart({
        businessId: product.businessId,
        item: {
          id: `${product.id}-${selectedVariant?.id ?? "base"}-${Date.now()}`,
          itemId: product.id,
          name: selectedVariant
            ? `${product.name} (${variantLabel(selectedVariant)})`
            : product.name,
          price: effectivePrice,
          quantity: qty,
          priceAtAdd: effectivePrice,
          image: product.image || null,
          variantId: selectedVariant?.id ?? null,
          variantLabel: selectedVariant ? variantLabel(selectedVariant) : null,
          maxStock: effectiveStock,
        },
      }),
    );

    // 🚀 FIXED: No longer navigates to /cart — the customer stays on the
    // product page and can keep browsing/adding items. A toast confirms
    // the add and offers a direct link to the cart if they want to check out.
    toast.success(
      <div className="flex items-center justify-between gap-3">
        <span>
          {qty} × {product.name}
          {selectedVariant ? ` (${variantLabel(selectedVariant)})` : ""} added
          to basket
        </span>
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="shrink-0 text-xs font-bold underline underline-offset-2"
        >
          View Cart
        </button>
      </div>,
    );

    // Reset quantity back to 1 so the next add starts fresh.
    setQty(1);
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
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Catalog
        </button>

        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <ShoppingCart className="size-4" />
          View Cart
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border bg-muted shadow-xs max-w-md mx-auto md:mx-0">
          <Image
            src={product.image || "/placeholder-product.jpg"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-black text-primary">
              ₦{effectivePrice.toLocaleString()}
            </p>
          </div>

          {typeof effectiveStock === "number" && (
            <div>
              {effectiveStock <= 0 ? (
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500">
                  Out of Stock
                </span>
              ) : effectiveStock <= LOW_STOCK_THRESHOLD ? (
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Only {effectiveStock} left
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
                "No product summary details configured by vendor space provider."}
            </p>
          </div>

          {hasVariants && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Choose an Option
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const isSoldOut = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={isSoldOut}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {variantLabel(v)}
                      {isSoldOut && " (Sold out)"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                      typeof effectiveStock === "number"
                        ? Math.min(effectiveStock, q + 1)
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

          <Button
            onClick={handleAddToCart}
            size="lg"
            disabled={isOutOfStock || (hasVariants && !selectedVariant)}
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
