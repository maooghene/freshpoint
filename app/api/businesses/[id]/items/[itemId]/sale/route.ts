// app/api/businesses/[id]/items/[itemId]/sale/route.ts
// Start or end a timed sale price on one item. Open to every plan.
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authOwner from "@/lib/authOwner";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateSale } from "@/lib/pricing";
import { verifyItemTenantOwnership } from "../../helpers";

interface RouteContext {
  params: Promise<{ id: string; itemId: string }>;
}

const saleSchema = z.object({
  salePrice: z.coerce.number().finite(),
  saleStartsAt: z.string().datetime().nullable().optional(),
  saleEndsAt: z.string().datetime(),
});

async function authorize(routeSlugOrId: string, itemId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const target = await prisma.business.findFirst({
    where: { OR: [{ id: routeSlugOrId }, { slug: routeSlugOrId }] },
    select: { id: true },
  });
  if (!target) {
    return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) };
  }
  const businessId = await authOwner(clerkId);
  if (!businessId || businessId !== target.id) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized tenant bounds matching" },
        { status: 401 },
      ),
    };
  }
  const item = await verifyItemTenantOwnership(itemId, businessId);
  if (!item) {
    return { error: NextResponse.json({ error: "Item not found" }, { status: 404 }) };
  }
  return { item };
}

/** Start (or replace) a sale on this item. */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const limited = await rateLimit(request, RATE_LIMITS.mutation);
  if (limited) return limited;
  try {
    const { id, itemId } = await params;
    const authz = await authorize(id, itemId);
    if ("error" in authz) return authz.error;

    const parsed = saleSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sale details." }, { status: 400 });
    }
    const { salePrice, saleStartsAt, saleEndsAt } = parsed.data;

    const problem = validateSale(authz.item.price, {
      salePrice,
      saleStartsAt,
      saleEndsAt,
    });
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        salePrice,
        saleStartsAt: saleStartsAt ? new Date(saleStartsAt) : null,
        saleEndsAt: new Date(saleEndsAt),
      },
      select: { id: true, price: true, salePrice: true, saleStartsAt: true, saleEndsAt: true },
    });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("ITEM_SALE_SET_ERROR:", error);
    return NextResponse.json({ error: "Could not save the sale." }, { status: 500 });
  }
}

/** End the sale now. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const limited = await rateLimit(request, RATE_LIMITS.mutation);
  if (limited) return limited;
  try {
    const { id, itemId } = await params;
    const authz = await authorize(id, itemId);
    if ("error" in authz) return authz.error;

    const item = await prisma.item.update({
      where: { id: itemId },
      data: { salePrice: null, saleStartsAt: null, saleEndsAt: null },
      select: { id: true, price: true, salePrice: true, saleStartsAt: true, saleEndsAt: true },
    });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("ITEM_SALE_END_ERROR:", error);
    return NextResponse.json({ error: "Could not end the sale." }, { status: 500 });
  }
}
