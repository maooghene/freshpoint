import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { authorizeBusinessAccess } from "@/lib/authorize-business-access";
import BroadcastForm from "./BroadcastForm";
import { hasPromotionalBroadcasts } from "@/lib/subscription-tiers";

export default async function BroadcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  const business = await prisma.business.findUnique({ where: { slug }, select: { id: true, ownerId: true, subscriptionTier: true } });
  if (!user || !business) notFound();
  const authorized = await authorizeBusinessAccess({ businessId: business.id, ownerId: business.ownerId, systemUserId: user.id, allowStaff: false });
  if (!authorized) redirect("/select-workspace");
  if (!hasPromotionalBroadcasts(business.subscriptionTier)) {
    return <main className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-border bg-card p-6"><h1 className="text-xl font-bold">Promotional broadcasts</h1><p className="mt-2 text-sm text-muted-foreground">This perk is available on Pro.</p></div></main>;
  }
  return <main className="mx-auto max-w-3xl p-6"><BroadcastForm businessId={business.id} /></main>;
}
