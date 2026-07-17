// components/admin/BusinessRecentOrders.tsx
import { BusinessDetailData } from "@/lib/actions/admin-business-detail";

interface OrdersProps {
  orders: BusinessDetailData["recentOrders"];
  totalCount: number;
}

export function BusinessRecentOrders({ orders, totalCount }: OrdersProps) {
  const compactCurrency = (val: number | null) => {
    if (val === null) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
    }).format(val);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Recent Product Orders ({totalCount})
      </h3>
      <div className="divide-y divide-border text-sm">
        {orders.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">
            No order history logged.
          </p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Code: {o.code}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString("en-NG", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <div className="text-right">
                <span
                  className="font-bold block text-foreground"
                  title={`₦${o.totalAmount}`}
                >
                  {compactCurrency(o.totalAmount)}
                </span>
                <span className="text-xs font-semibold capitalize text-muted-foreground">
                  {o.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
