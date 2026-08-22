import { BookingStatus, OrderStatus } from "@prisma/client";

export type BookingSummary = {
  createdAt: Date;
  status: BookingStatus;
  totalAmount: number | null;
};

export type OrderSummary = {
  createdAt: Date;
  status: OrderStatus;
  totalAmount: number | null;
};

export type ActivityUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null;

// 💡 HELPER 1: Computes dynamic time-series charts metrics
export function computeTimelineData(
  bookings: BookingSummary[],
  orders: OrderSummary[],
) {
  const monthsKey = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const liveChartMap: Record<
    string,
    { period: string; Revenue: number; Bookings: number; Orders: number }
  > = {};

  const currentMonthIdx = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
    const label = monthsKey[targetMonthIdx];
    liveChartMap[label] = { period: label, Revenue: 0, Bookings: 0, Orders: 0 };
  }

  bookings.forEach((b) => {
    const bMonth = monthsKey[new Date(b.createdAt).getMonth()];
    if (liveChartMap[bMonth]) {
      liveChartMap[bMonth].Bookings += 1;
      if (b.status === BookingStatus.COMPLETED)
        liveChartMap[bMonth].Revenue += b.totalAmount || 0;
    }
  });

  orders.forEach((o) => {
    const oMonth = monthsKey[new Date(o.createdAt).getMonth()];
    if (liveChartMap[oMonth]) {
      liveChartMap[oMonth].Orders += 1;
      if (o.status === OrderStatus.DELIVERED)
        liveChartMap[oMonth].Revenue += o.totalAmount || 0;
    }
  });

  return Object.values(liveChartMap);
}

// 💡 HELPER 2: Merges incoming user actions cleanly into a sorted timeline array
export function mergeActivities(
  latestBookings: Array<
    BookingSummary & { id: string; code?: string; user?: ActivityUser }
  >,
  latestOrders: Array<
    OrderSummary & { id: string; code?: string; user?: ActivityUser }
  >,
) {
  return [
    ...latestBookings.map((b) => ({
      id: b.id,
      // Priority is given to your dynamic chronological code format e.g. "FP-2607-X"
      displayId: b.code ? b.code : `#${b.id.slice(-8).toUpperCase()}`,
      type: "BOOKING" as const,
      customerName:
        `${b.user?.firstName ?? ""} ${b.user?.lastName ?? ""}`.trim() ||
        "Anonymous Guest",
      customerEmail: b.user?.email || "guest@freshpoint.com",
      status: b.status,
      amount: b.totalAmount || 0,
      createdAt: b.createdAt,
    })),
    ...latestOrders.map((o) => ({
      id: o.id,
      displayId: o.code ? o.code : `#${o.id.slice(-8).toUpperCase()}`,
      type: "ORDER" as const,
      customerName:
        `${o.user?.firstName ?? ""} ${o.user?.lastName ?? ""}`.trim() ||
        "Anonymous Shopper",
      customerEmail: o.user?.email || "shopper@freshpoint.com",
      status: o.status,
      amount: o.totalAmount || 0,
      createdAt: o.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
