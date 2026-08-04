// app/business/[slug]/orders/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingBagIcon,
  PackageIcon,
  Loader2,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { OrderStatusStats } from "@/components/business/orders/OrderStatusStats";
import { BusinessOrderCard } from "@/components/business/orders/BusinessOrderCard";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item: { name: string; image: string | null; price: number };
}

interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  customerPhone: string | null; // Appended for emergency dispatch tracking
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryFee: number;
  user: { firstName: string | null; lastName: string | null; email: string };
  items: OrderItem[];
}


const statusStyles: Record<OrderStatus, string> = {
  PENDING:
    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  PROCESSING:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  SHIPPED:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  DELIVERED:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function BusinessOrdersPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [fulfillmentFilter, setFulfillmentFilter] = useState<
    "all" | "delivery" | "pickup"
  >("all");

  // 🚀 FIXED RESOLUTION: Moved inner pipeline logic into the hook wrapper closure
  // to avoid cascading synchronous render traps completely
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    async function loadStorefrontData() {
      try {
        if (isMounted) setLoading(true);

        const bizRes = await fetch(`/api/businesses/slug/${slug}`);
        if (!bizRes.ok) throw new Error("Business missing");
        const bizData = await bizRes.json();

        if (isMounted) setBusinessId(bizData.id);

        const res = await fetch(`/api/orders?businessId=${bizData.id}`);
        if (!res.ok) throw new Error("Orders mismatch");
        const data = await res.json();

        if (isMounted) {
          setOrders(data.orders || []);
        }
      } catch (err: unknown) {
        console.error("Data pipeline load exception:", err);
        if (isMounted) toast.error("Failed to load storefront order lines");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStorefrontData();

    return () => {
      isMounted = false; // Prevents updating state on unmounted components
    };
  }, [slug]);

  // Handle manual dashboard user-triggered refreshes safely outside initial render cycles
  const handleManualRefresh = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?businessId=${businessId}`);
      if (!res.ok) throw new Error("Refresh failed");
      const d = await res.json();
      setOrders(d.orders || []);
      toast.success("Orders synchronized successfully.");
    } catch {
      toast.error("Could not sync refresh items data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed validation change");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      toast.success(`Order marked as ${newStatus.toLowerCase()}`);
    } catch (err: unknown) {
      toast.error("Failed to adjust transaction status parameter");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin w-7 h-7 text-primary" />
        <span className="text-sm font-medium">Loading orders...</span>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (fulfillmentFilter === "delivery") return o.isDelivery;
    if (fulfillmentFilter === "pickup") return !o.isDelivery;
    return true;
  });

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBagIcon className="w-7 h-7 text-primary" /> Orders
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Track and manage all product orders from your customers.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors border border-border rounded-xl px-3 py-2 hover:bg-muted/50 cursor-pointer"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <OrderStatusStats orders={orders} />

      {orders.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-muted/20">
          <PackageIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">
            No Orders Yet
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Product orders from your customers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <BusinessOrderCard
              key={order.id}
              order={order}
              statusStyles={statusStyles}
              statusTransitions={statusTransitions}
              updatingId={updatingId}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}