"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch } from "@/lib/store"; // FIXED: Uses your central type-safe hook
import { addItemToCart } from "@/lib/features/cartSlice";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";

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

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        // Fetches from your multi-tenant inventory router endpoint
        const res = await fetch(`/api/items/${params.id}`);
        if (!res.ok) throw new Error("Product data unavailable");

        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("FAILED TO FETCH PRODUCT SPECIFICATIONS:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchProductDetails();
  }, [params?.id]);

  const handleAddToCart = () => {
    if (!product) return;

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

          <div className="border-t border-b border-border py-4">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {product.description ||
                "No product summary details configured by vendor space provider."}
            </p>
          </div>

          {/* HIGH-UTILITY QUANTITY STEP CONTROLLER CHIPS */}
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
                onClick={() => setQty((q) => q + 1)}
                className="h-9 w-9 flex items-center justify-center border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                aria-label="Increase bundle size"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* DISPATCH ACTION TRIGGER GATES */}
          <Button
            onClick={handleAddToCart}
            size="lg"
            className="w-full md:w-auto px-10 py-6 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-300 gap-2 cursor-pointer mt-4"
          >
            <ShoppingCart className="size-5" />
            Add item to Basket
          </Button>
        </div>
      </div>
    </div>
  );
}
