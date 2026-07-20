"use client";

import * as React from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { ClientOrderDataShape } from "./StaffDashboardClient";

interface OrdersListProps {
  orders: ClientOrderDataShape[];
  search: string;
}

export function SharedStoreOrdersList({ orders, search }: OrdersListProps) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return orders;

    return orders.filter((o) => {
      const fullName =
        `${o.user?.firstName || ""} ${o.user?.lastName || ""}`.toLowerCase();
      const matchId = o.id.toLowerCase();
      return fullName.includes(query) || matchId.includes(query);
    });
  }, [orders, search]);

  const handleOrderStatusTransition = async (
    orderId: string,
    targetStatus: string,
  ) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        toast.error(data.error || "Logistics state assignment exception.");
        return;
      }

      toast.success(`Order reference updated to ${targetStatus.toLowerCase()}`);
      window.location.reload();
    } catch (err: unknown) {
      toast.error("Failed to connect to checkout fulfillment lines.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-12 text-center bg-card/40">
        <ShoppingBag className="h-8 w-8 text-muted-foreground/60 mb-3" />
        <p className="text-xs font-bold text-foreground">
          {"No matching facility orders found."}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden w-full min-w-0 shadow-sm">
      <div className="overflow-x-auto custom-scrollbar w-full">
        <table className="w-full min-w-[600px] text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground text-[10px] uppercase tracking-wider select-none">
              <th className="p-4">{"Order reference"}</th>
              <th className="p-4">{"Purchasing Customer"}</th>
              <th className="p-4">{"Logistics State"}</th>
              <th className="p-4 text-right">{"Transaction Value"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((order) => {
              const isUpdating = updatingId === order.id;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="p-4 font-mono text-[11px] font-bold text-foreground uppercase tracking-wider">
                    {"#"}
                    {order.id.slice(-8)}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-foreground">
                      {order.user?.firstName} {order.user?.lastName}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isUpdating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleOrderStatusTransition(
                              order.id,
                              e.target.value,
                            )
                          }
                          className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase outline-none bg-background cursor-pointer ${
                            order.status === "DELIVERED"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : order.status === "PROCESSING"
                                ? "bg-foreground/5 text-foreground border-border"
                                : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <option value="PENDING">{"Pending"}</option>
                          <option value="PROCESSING">{"Processing"}</option>
                          <option value="DELIVERED">{"Delivered"}</option>
                          <option value="CANCELLED">{"Cancelled"}</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-foreground font-mono tabular-nums">
                    {"₦"}
                    {(order.totalAmount || 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
