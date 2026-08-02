// app/(public)/checkout/products/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { clearCart, CartItem } from "@/lib/features/cartSlice";
import { Loader2, AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useDeliveryFeeCalculation } from "@/hooks/useDeliveryFeeCalculation";
import { DeliveryMethodToggle } from "@/components/checkout/DeliveryMethodToggle";
import { DeliveryAddressField } from "@/components/checkout/DeliveryAddressField";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

// Modular sub-components
import { CheckoutStockAlert } from "@/components/checkout/CheckoutStockAlert";
import { CheckoutContactField } from "@/components/checkout/CheckoutContactField";
import { CheckoutEmptyState } from "@/components/checkout/CheckoutEmptyState";
import { isValidNigerianPhone } from "@/components/checkout/CheckoutContactField";

const PaystackButton = dynamic(() => import("@/components/PaystackButton"), {
  ssr: false,
});

interface StockIssue {
  itemId: string;
  name: string;
  cartQty: number;
  available: number;
  exists: boolean;
}

type StockCheckStatus = "checking" | "ok" | "issues" | "error";

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
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const [stockCheckStatus, setStockCheckStatus] =
    useState<StockCheckStatus>("checking");
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);

  const {
    deliveryFee,
    estimatedDistance,
    calculatingFee,
    fallbackMessage,
    coordinates,
  } = useDeliveryFeeCalculation(businessId ?? "", isDelivery, address || "");

  const currency = "₦";

  // Single mount effect: runs stock evaluation and historical profile pre-filling concurrently
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    async function checkStockAndProfile() {
      setStockCheckStatus("checking");
      const ids = Array.from(new Set(items.map((i: CartItem) => i.itemId)));

      try {
        // Run lookups in parallel to minimize load times
        const [stockRes, profileRes] = await Promise.all([
          fetch(
            `/api/items/stock-check?ids=${ids.map(encodeURIComponent).join(",")}`,
          ),
          fetch("/api/users/profile-phone"),
        ]);

        if (!stockRes.ok) throw new Error("Stock check request failed");

        // Set phone string directly if a previous record matches
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.phone && !cancelled) {
            setCustomerPhone(profileData.phone);
          }
        }

        const data: {
          items: { itemId: string; stock: number; exists: boolean }[];
        } = await stockRes.json();
        const stockByItemId = new Map(
          data.items.map((entry) => [entry.itemId, entry]),
        );

        const issues: StockIssue[] = [];
        for (const cartItem of items as CartItem[]) {
          const current = stockByItemId.get(cartItem.itemId);
          const available = current ? current.stock : 0;
          const exists = current ? current.exists : false;

          if (!exists || available < cartItem.quantity) {
            issues.push({
              itemId: cartItem.itemId,
              name: cartItem.name,
              cartQty: cartItem.quantity,
              available,
              exists,
            });
          }
        }

        if (cancelled) return;
        setStockIssues(issues);
        setStockCheckStatus(issues.length > 0 ? "issues" : "ok");
      } catch (error) {
        console.error("CHECKOUT_INITIALIZATION_ERROR:", error);
        if (!cancelled) setStockCheckStatus("error");
      }
    }

    checkStockAndProfile();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items.length === 0) {
    return <CheckoutEmptyState />;
  }

  const absoluteFinalTotal = cartSubtotal + deliveryFee;
  const isFormValid =
    (!isDelivery || (coordinates !== null && !calculatingFee)) &&
    isValidNigerianPhone(customerPhone);

  const handleSuccess = async (reference: any) => {
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
          deliveryLatitude: isDelivery ? (coordinates?.latitude ?? null) : null,
          deliveryLongitude: isDelivery
            ? (coordinates?.longitude ?? null)
            : null,
          deliveryFee,
          customerPhone: customerPhone.trim(),
          items: items.map((i: CartItem) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      if (res.ok) {
        dispatch(clearCart());
              router.push(
                `/orders/success?reference=${encodeURIComponent(reference)}`,
              );
              dispatch(clearCart());

      } else {
        console.error("Order completion failed at backend processing step");
      }
    } catch (err) {
      console.error("ORDER_CONFIRMATION_FALLBACK_CATCH:", err);
    }
  };

  function renderPayButton() {
    if (stockCheckStatus === "checking") {
      return (
        <Button
          disabled
          className="w-full py-5 rounded-xl text-xs font-bold opacity-50 flex items-center justify-center gap-2 bg-muted text-muted-foreground"
        >
          <Loader2 className="animate-spin h-4 w-4" />
          Checking stock availability...
        </Button>
      );
    }

    if (stockCheckStatus === "error") {
      return (
        <Button
          variant="destructive"
          onClick={() => {
            setStockCheckStatus("checking");
            router.refresh();
          }}
          className="w-full py-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangleIcon className="h-4 w-4" />
          Couldn&apos;t verify stock — Click to retry
        </Button>
      );
    }

    if (stockCheckStatus === "issues") {
      return <CheckoutStockAlert issues={stockIssues} />;
    }

    return (
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
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 pt-24 min-h-screen space-y-6 bg-background text-foreground">
      <h1 className="text-xl font-black tracking-tight border-b border-border pb-2 text-foreground">
        Checkout Manifest
      </h1>

      <DeliveryMethodToggle
        isDelivery={isDelivery}
        onChange={(val) => setIsDelivery(val)}
      />

      {isDelivery && (
        <DeliveryAddressField
          address={address}
          onChange={setAddress}
          calculatingFee={calculatingFee}
          estimatedDistance={estimatedDistance}
          fallbackMessage={fallbackMessage}
        />
      )}

      <CheckoutContactField
        value={customerPhone}
        onChange={setCustomerPhone}
        variant="order"
      />

      <OrderSummaryCard
        currency={currency}
        cartSubtotal={cartSubtotal}
        isDelivery={isDelivery}
        deliveryFee={deliveryFee}
        absoluteFinalTotal={absoluteFinalTotal}
        canPay={isFormValid}
        calculatingFee={calculatingFee}
        payButton={renderPayButton()}
      />
    </div>
  );
}
