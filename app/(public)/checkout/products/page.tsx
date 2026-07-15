// app/(public)/checkout/products/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { clearCart, CartItem } from "@/lib/features/cartSlice";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useDeliveryFeeCalculation } from "@/hooks/useDeliveryFeeCalculation";
import { DeliveryMethodToggle } from "@/components/checkout/DeliveryMethodToggle";
import { DeliveryAddressField } from "@/components/checkout/DeliveryAddressField";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

const PaystackButton = dynamic(() => import("@/components/PaystackButton"), {
  ssr: false,
});

export default function ProductCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <Loader2 className="animate-spin w-6 h-6 text-primary" />
        </div>
      }
    >
      <ProductCheckoutContent />
    </Suspense>
  );
}

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

  // Fixed: Short-Circuit Null Gate Override satisfies compiler constraints perfectly
  const { deliveryFee, estimatedDistance, calculatingFee, fallbackMessage } =
    useDeliveryFeeCalculation(businessId ?? "", isDelivery, address);

  const currency = "₦";

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
  const canPay = !isDelivery || (address.trim().length > 0 && !calculatingFee);

  const handleSuccess = async (reference: string) => {
    try {
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
      const errorMsg =
        error instanceof Error ? error.message : "Operational Failure";
      console.error("ORDER_CONFIRMATION_NETWORK_ERROR:", errorMsg);
      alert("Operational connection drop. Please contact customer support.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 pt-24 min-h-screen space-y-6 bg-background text-foreground">
      <h1 className="text-xl font-black tracking-tight border-b border-border pb-2 text-foreground">
        Checkout Manifest
      </h1>

      <DeliveryMethodToggle isDelivery={isDelivery} onChange={setIsDelivery} />

      {isDelivery && (
        <DeliveryAddressField
          address={address}
          onChange={setAddress}
          calculatingFee={calculatingFee}
          estimatedDistance={estimatedDistance}
          fallbackMessage={fallbackMessage}
        />
      )}

      <OrderSummaryCard
        currency={currency}
        cartSubtotal={cartSubtotal}
        isDelivery={isDelivery}
        deliveryFee={deliveryFee}
        absoluteFinalTotal={absoluteFinalTotal}
        canPay={canPay}
        calculatingFee={calculatingFee}
        payButton={
          <PaystackButton
            amount={absoluteFinalTotal}
            email={
              user?.emailAddresses?.[0]?.emailAddress || "customer@example.com"
            }
            name={user?.fullName || "Customer"}
            metadata={{
              userId,
              businessId: businessId ?? "",
              orderType: "PRODUCT",
            }}
            onSuccess={handleSuccess}
            onClose={() => {}}
          />
        }
      />
    </div>
  );
}
