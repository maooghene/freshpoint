import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ==========================================
// TYPES & INTERFACES (STRICT TYPE SAFETY BANS ANY)
// ==========================================
interface UserRelationPayload {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface BusinessRelationPayload {
  name: string;
  address: string;
}

interface ItemCatalogPayload {
  name: string;
  image: string | null;
}

interface OrderLineItemPayload {
  id: string;
  quantity: number;
  price: unknown;
  item: ItemCatalogPayload | null;
}

interface DatabaseOrderRecord {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  user: UserRelationPayload;
  business?: BusinessRelationPayload;
  items: OrderLineItemPayload[];
}

// ✅ GET: Multi-tenant endpoint supporting Vendor Lists (?businessId=) AND Success Page Lookups (?reference=)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const reference = searchParams.get("reference");

    // 🌟 BRANCH ROUTE A: Handle Checkout Success Landing Page Query Lookup
    if (reference) {
      const singleOrderLookup = await prisma.order.findFirst({
        where: {
          OR: [{ id: reference }, { code: reference }],
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          // 🌟 FIXED: FETCH THE BUSINESS RELATION SO THE RECEIPT CARD SHOWS THE TRUE NAME
          business: {
            select: {
              name: true,
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
      });

      if (!singleOrderLookup) {
        return NextResponse.json(
          { error: "Requested transactional order tracking records not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          order: {
            id: singleOrderLookup.id,
            code: singleOrderLookup.code,
            status: singleOrderLookup.status,
            totalAmount: singleOrderLookup.totalAmount,
            isDelivery: singleOrderLookup.isDelivery,
            deliveryAddress: singleOrderLookup.deliveryAddress,
            deliveryNotes: singleOrderLookup.deliveryNotes,
            deliveryFee: singleOrderLookup.deliveryFee,
            createdAt: singleOrderLookup.createdAt.toISOString(),
            user: singleOrderLookup.user,
            business: singleOrderLookup.business,
            items: singleOrderLookup.items.map((line) => ({
              id: line.id,
              quantity: line.quantity,
              price: Number(line.price),
              item: {
                name: line.item?.name || "Product Item",
                image: line.item?.image || null,
              },
            })),
          },
        },
        { status: 200 },
      );
    }

    // 🌟 BRANCH ROUTE B: Handle Vendor Dashboard Management Screen Orders Extraction
    if (!businessId) {
      return NextResponse.json(
        {
          error:
            "Missing required query route mapping parameters (businessId or reference)",
        },
        { status: 400 },
      );
    }

    const businessOrders = (await prisma.order.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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
    })) as unknown as DatabaseOrderRecord[];

    return NextResponse.json(
      {
        success: true,
        orders: businessOrders.map((order) => ({
          id: order.id,
          code: order.code,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt:
            order.createdAt instanceof Date
              ? order.createdAt.toISOString()
              : String(order.createdAt),
          user: order.user,
          items: order.items.map((line) => ({
            id: line.id,
            quantity: line.quantity,
            price: Number(line.price),
            item: {
              name: line.item?.name || "Product Item",
              image: line.item?.image || null,
            },
          })),
        })),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("CRITICAL_ORDERS_ROUTING_ENDPOINT_FAILURE:", error);
    return NextResponse.json(
      {
        error:
          "Could not safely process checkout data structures or merchant arrays",
      },
      { status: 500 },
    );
  }
}
