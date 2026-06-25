"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item: {
    name: string;
    image: string | null;
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items: OrderItem[];
}

interface BusinessOrdersProps {
  businessSlug: string;
}

export default function BusinessOrders({ businessSlug }: BusinessOrdersProps) {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = "₦";

  useEffect(() => {
    if (!businessSlug) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        // Securely pass the businessSlug to the backend to get tenant-specific orders
        const { data } = await axios.get<{ orders: Order[] }>(
          `/api/business/orders?slug=${businessSlug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setOrders(data.orders);
      } catch (error) {
        toast.error("Failed to load business orders.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [businessSlug, getToken]);

  if (loading) return <Loading />;

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground text-sm">
        No orders found for this workspace.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
            <th className="p-4">Order ID</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Products</th>
            <th className="p-4">Total</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-card-foreground">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-4 font-mono text-xs max-w-[100px] truncate">
                #{order.id}
              </td>
              <td className="p-4">
                <div className="font-medium">
                  {order.user.firstName} {order.user.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.user.email}
                </div>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  {order.items.map((orderItem) => (
                    <div key={orderItem.id} className="text-xs">
                      <span className="font-semibold">
                        {orderItem.quantity}x
                      </span>{" "}
                      {orderItem.item.name}
                    </div>
                  ))}
                </div>
              </td>
              <td className="p-4 font-bold">
                {currency}
                {order.totalAmount.toLocaleString()}
              </td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    order.status === "DELIVERED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {order.status.toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
