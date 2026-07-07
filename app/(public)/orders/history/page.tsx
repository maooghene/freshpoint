import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import CustomerHistoryLedger from "@/components/orders/CustomerHistoryLedger";

export default async function CustomerOrdersHistoryPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }

  // Identify the core User record from the Clerk session context link
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    redirect("/explore");
  }

  // Aggregate customer data history with item details and business models
  const rawOrders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      business: {
        select: {
          name: true,
          phone: true,
          address: true,
        },
      },
      items: {
        include: {
          item: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Explicit type transformation filtering to prevent serialization anomalies
  const structuredOrders = rawOrders.map((order) => ({
    id: order.id,
    code: order.code || "",
    status: String(order.status),
    totalAmount: Number(order.totalAmount),
    isDelivery: Boolean(order.isDelivery),
    deliveryAddress: order.deliveryAddress
      ? String(order.deliveryAddress)
      : null,
    deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : 0,
    createdAt: order.createdAt.toISOString(),
    businessId: order.businessId, // ✅ ADDED — needed by OrderCard → ReviewModal for the ratings POST
    business: {
      name: order.business.name,
      phone: order.business.phone,
      address: order.business.address,
    },
    items: order.items.map((lineItem) => ({
      id: lineItem.id,
      itemId: lineItem.itemId, // ✅ ADDED — needed by OrderCard → ReviewModal (item.itemId)
      quantity: lineItem.quantity,
      price: Number(lineItem.price),
      name: lineItem.item?.name || "Product Item",
      image: lineItem.item?.image || null,
    })),
  }));

  return (
    <main className="min-h-screen pt-8 pb-16 px-4 max-w-4xl mx-auto space-y-4 bg-background text-foreground transition-colors duration-200">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-black tracking-tight">Purchase Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, trace, and monitor your platform order histories and live
          package tracking metrics.
        </p>
      </div>

      <CustomerHistoryLedger initialOrders={structuredOrders} />
    </main>
  );
}
