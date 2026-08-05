"use client";

import * as React from "react";
import {
  PackageSearch,
  Search,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

interface UserPayload {
  firstName: string | null;
  lastName: string | null;
}

interface OrderShape {
  id: string;
  status: string;
  totalAmount: number | null;
  createdAt: Date;
  user: UserPayload | null;
}

interface StaffOrdersClientProps {
  initialOrders: OrderShape[];
}

export function StaffOrdersClient({ initialOrders }: StaffOrdersClientProps) {
  const [orders, setOrders] = React.useState<OrderShape[]>(initialOrders);
  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  // Sync state if initialProps updates server-side
  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(
          "Failed to update execution phase state status context",
        );
      }

      // Update local state smoothly
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (error) {
      console.error("Order workflow transition failure node error:", error);
      alert(
        "Error handling pipeline change action request verification mismatch.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const matchStatus =
        statusFilter === "ALL" ||
        order.status.toUpperCase() === statusFilter.toUpperCase();

      const query = search.toLowerCase().trim();
      if (!query) return matchStatus;

      const fullName =
        `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.toLowerCase();
      const matchId = order.id.toLowerCase();

      return (
        matchStatus && (fullName.includes(query) || matchId.includes(query))
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-border/80 bg-card p-4 rounded-2xl shadow-3xs">
        <div className="relative flex items-center bg-background border border-border rounded-xl px-3 py-2 w-full sm:flex-1 max-w-md shadow-inner">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search order references or buyer profiles..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary shadow-3xs"
          >
            <option value="ALL">{"All Orders Pipeline"}</option>
            <option value="PENDING">{"Pending"}</option>
            <option value="PROCESSING">{"Processing"}</option>
            <option value="DELIVERED">{"Delivered"}</option>
            <option value="CANCELLED">{"Cancelled"}</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/50">
          <PackageSearch className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">
            {
              "No matching facility orders logged under this location block yet."
            }
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card overflow-hidden w-full min-w-0 shadow-2xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground text-[10px] uppercase tracking-wider select-none">
                  <th className="p-4">{"Order Code"}</th>
                  <th className="p-4">{"Purchaser Profile"}</th>
                  <th className="p-4">{"Fulfillment Phase"}</th>
                  <th className="p-4">{"Action Controls"}</th>
                  <th className="p-4">{"Logged Date"}</th>
                  <th className="p-4 text-right">{"Transaction Value"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="p-4 font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                      {"#"}
                      {order.id.slice(-8)}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {order.user?.firstName
                        ? `${order.user.firstName} ${order.user.lastName || ""}`
                        : "Walk-in Client"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : order.status === "PROCESSING"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : order.status === "CANCELLED"
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={updatingId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground outline-none disabled:opacity-50"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        {updatingId === order.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs font-medium whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right font-bold text-foreground font-mono tabular-nums min-w-[100px]">
                      {"₦"}
                      {(order.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
