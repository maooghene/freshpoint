// app/(public)/orders/success/page.tsx

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReceiptCard from "@/components/receipt/ReceiptCard";
import { OrderData } from "@/components/receipt/types";
import ReceiptSkeleton from "@/components/receipt/ReceiptSkeleton";

// Define strict typing envelope matching the backend route delivery format
interface OrderApiResponsePayload {
  success: boolean;
  order: OrderData;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(reference));
  const [error, setError] = useState<string | null>(
    reference
      ? null
      : "Missing valid checkout identification reference string.",
  );

  useEffect(() => {
    if (!reference) return;

    let retryCount = 0;
    const maxRetries = 4; // Maximum re-polling iterations
    let pollTimeoutId: NodeJS.Timeout;

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(
          `/api/orders?reference=${encodeURIComponent(reference)}`,
        );

        if (!response.ok) {
          if (response.status === 404 && retryCount < maxRetries) {
            retryCount++;
            pollTimeoutId = setTimeout(fetchOrderDetails, 1500); // Check again in 1.5 seconds
            return;
          }
          throw new Error("Order parameters could not be found.");
        }

        // 🌟 FIXED: Cast to envelope wrapper layout type instead of forcing OrderData on the root level
        const data = (await response.json()) as OrderApiResponsePayload;

        // Extract the nested order node safely
        if (data && data.success && data.order) {
          setOrder(data.order);
          setError(null);
        } else {
          throw new Error(
            "Received malformed payload signature data from server.",
          );
        }

        setLoading(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
      fetchOrderDetails();
    }, 100);

    return () => {
      clearTimeout(handler);
      if (pollTimeoutId) clearTimeout(pollTimeoutId);
    };
  }, [reference]);

  if (loading) return <ReceiptSkeleton />;

  if (error || !reference) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto bg-background text-foreground">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6 ring-8 ring-destructive/5">
          <Receipt className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-3">
          Could Not Load Receipt
        </h2>
        <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
          {error || "Missing reference token."}
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-xl w-full font-bold shadow-md"
        >
          <Link href="/explore">Return to Platform Explore</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 bg-background text-foreground transition-colors duration-200">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-xs text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
            <CheckCircleIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-card-foreground mb-3">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground text-sm font-medium max-w-sm leading-relaxed">
            Your transaction processed smoothly. The business manager dashboard
            has been notified.
          </p>
        </div>

        {order && <ReceiptCard order={order} />}

        <div className="flex flex-col gap-3 pt-2 w-full">
          <Button
            asChild
            size="lg"
            className="w-full rounded-xl font-bold shadow-md transition-transform active:scale-[0.98]"
          >
            <Link href="/explore">Continue Shopping</Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-xl font-bold border border-border shadow-2xs hover:bg-muted transition-colors"
            >
              <Link href="/orders/history">View Order History</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl font-semibold bg-card text-card-foreground border-border hover:bg-muted/50 transition-colors"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<ReceiptSkeleton />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
