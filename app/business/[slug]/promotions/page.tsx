import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import { hasPromotionalBroadcasts } from "@/lib/subscription-tiers";
import PromotionManager from "./PromotionManager";

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, subscriptionTier: true },
  });
  if (!user || !business) notFound();

  const authorized = await authorizeBusinessAccess({
    businessId: business.id,
    ownerId: business.ownerId,
    systemUserId: user.id,
    allowStaff: false,
  });
  if (!authorized) redirect("/select-workspace");

  if (!hasPromotionalBroadcasts(business.subscriptionTier)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="text-xl font-bold">Promotions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Timed storefront promotions are available on Pro.
          </p>
        </div>
      </main>
    );
  }

  const now = new Date();
  const active = await prisma.promotion.findFirst({
    where: { businessId: business.id, isActive: true, endsAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, details: true, endsAt: true },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <PromotionManager
        businessId={business.id}
        active={
          active
            ? { ...active, endsAt: active.endsAt.toISOString() }
            : null
        }
      />
    </main>
  );
}
