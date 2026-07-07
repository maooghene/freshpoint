"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { clearCart, CartItem } from "@/lib/features/cartSlice";
import { Button } from "@/components/ui/button";
import { Loader2, Store, Truck, MapPin } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const PaystackButton = dynamic(() => import("@/components/PaystackButton"), {
  ssr: false,
});

function ProductCheckoutContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const dispatch = useAppDispatch();

  const {
    items,
    totalAmount: cartSubtotal,
    businessId,
  } = useAppSelector((state) => state.cart);
  const [isDelivery, setIsDelivery] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [calculatingFee, setCalculatingFee] = useState<boolean>(false);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);

  const currency = "₦";

  useEffect(() => {
    if (!isDelivery || !address.trim() || address.trim().length < 6) {
      const resetHandler = setTimeout(() => {
        setDeliveryFee(0);
        setEstimatedDistance(0);
      }, 0);
      return () => clearTimeout(resetHandler);
    }

    const triggerDistanceCalculation = async () => {
      try {
        setCalculatingFee(true);
        const res = await fetch("/api/delivery/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, destinationAddress: address }),
        });
        if (res.ok) {
          const data = await res.json();
          setDeliveryFee(data.deliveryFee);
          setEstimatedDistance(data.distanceKm);
        }
      } catch (err) {
        console.error("FEE_CALCULATION_ERROR:", err);
      } finally {
        setCalculatingFee(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      triggerDistanceCalculation();
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [address, isDelivery, businessId]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground animate-fadeIn">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          Your basket is currently empty.
        </p>
        <Button
          asChild
          variant="outline"
          className="rounded-xl font-bold border-border shadow-xs hover:bg-muted/40 transition-colors"
        >
          <Link href="/explore">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  const absoluteFinalTotal = cartSubtotal + deliveryFee;

  const handleSuccess = async (reference: string) => {
    try {
      // FIXED: Awaiting backend network confirmation directly to freeze execution until row is written
      const res = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          businessId,
          totalAmount: absoluteFinalTotal,
          isDelivery,
          deliveryAddress: isDelivery ? address.trim() : null,
          deliveryFee,
          items: items.map((i: CartItem) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      const result = await res.json();

      // Guard check: Halt routing loops if database insertion crashes internally
      if (result.success || res.ok) {
        dispatch(clearCart());
        router.push(
          `/orders/success?reference=${encodeURIComponent(reference)}`,
        );
      } else {
        alert(
          "Payment was approved by Paystack, but database synchronization failed. Please contact support.",
        );
      }
    } catch (error: unknown) {
      console.error("ORDER_CONFIRMATION_NETWORK_ERROR:", error);
      alert("Operational connection drop. Please contact customer support.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 pt-24 min-h-screen space-y-6 bg-background text-foreground">
      <h1 className="text-xl font-black tracking-tight border-b pb-2">
        Checkout Manifest
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setIsDelivery(false);
          }}
          className={`p-4 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-sm font-bold transition-all ${!isDelivery ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
        >
          <Store className="w-4 h-4" /> Store Pickup
        </button>
        <button
          type="button"
          onClick={() => setIsDelivery(true)}
          className={`p-4 rounded-xl border flex flex-col items-center gap-1 cursor-pointer text-sm font-bold transition-all ${isDelivery ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
        >
          <Truck className="w-4 h-4" /> Home Delivery
        </button>
      </div>

      {isDelivery && (
        <div className="space-y-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter complete shipping street address..."
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          {calculatingFee && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="animate-spin w-3 h-3 text-primary" /> Mapping
              route distance metrics...
            </p>
          )}
          {estimatedDistance > 0 && !calculatingFee && (
            <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Estimated Distance:{" "}
              {estimatedDistance} km from storefront workspace.
            </p>
          )}
        </div>
      )}

      <div className="border border-border rounded-2xl p-4 bg-card space-y-3.5 shadow-sm">
        <div className="space-y-2 text-xs font-medium text-muted-foreground pb-2 border-b border-dashed border-border">
          <div className="flex justify-between items-center">
            <span>Cart Items Subtotal</span>
            <span className="text-foreground font-bold">
              {currency}
              {Number(cartSubtotal).toLocaleString()}
            </span>
          </div>
          {isDelivery && (
            <div className="flex justify-between items-center">
              <span>Delivery fee</span>
              <span className="text-primary font-bold">
                {currency}
                {Number(deliveryFee).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-muted-foreground">
            Settled Total Amount
          </span>
          <span className="font-black text-xl text-primary">
            {currency}
            {Number(absoluteFinalTotal).toLocaleString()}
          </span>
        </div>

        {isDelivery && (!address.trim() || calculatingFee) ? (
          <Button
            disabled
            className="w-full py-5 rounded-xl text-xs font-bold opacity-50 bg-muted text-muted-foreground"
          >
            {calculatingFee
              ? "Adjusting Surcharge Rates..."
              : "Provide Destination Address to Pay"}
          </Button>
        ) : (
          <PaystackButton
            amount={absoluteFinalTotal}
            email={
              user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"
            }
            name={user?.fullName || "Customer"}
            metadata={{ userId, businessId, orderType: "PRODUCT" }}
            onSuccess={handleSuccess}
            onClose={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export default function ProductCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary size-7" />
        </div>
      }
    >
      <ProductCheckoutContent />
    </Suspense>
  );
}
