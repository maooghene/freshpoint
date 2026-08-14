import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { BookingPolicyForm } from "./BookingPolicyForm";
import { Building2 } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function VendorSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Include staff rows to find the owner's corresponding specialist profile
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      owner: true,
      staff: true,
    },
  });

  if (!business) {
    notFound();
  }

  if (business.owner.clerkId !== userId) {
    redirect("/dashboard");
  }

  // Find the exact system user id associated with the active Clerk session
  const userRecord = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  const ownerProfileRow = business.staff.find(
    (s) => s.userId === userRecord?.id,
  );

  // 🎯 STRICT TYPE EXCLUSION: Ensure an absolute boolean fallback value fallsdown
  const computedOwnerIsActive = ownerProfileRow
    ? ownerProfileRow.isActive
    : true;

  const serializedBusinessForForm = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    phone: business.phone,
    address: business.address,
    sittingCapacity: business.sittingCapacity,
    categories: business.categories,
    description: business.description,
    image: business.image ?? null,
    baseDeliveryFee: business.baseDeliveryFee ?? 0,
    deliveryFeePerKm: business.deliveryFeePerKm ?? 0,
    deliveryRadiusKm: business.deliveryRadiusKm ?? null,
    subscriptionTier: business.subscriptionTier,
    // Add parameters safely to the carrier shape objects
    initialOwnerActive: computedOwnerIsActive,
  };

  const serializedPoliciesForForm = {
    id: business.id,
    slug: business.slug,
    minNoticeHours: business.minNoticeHours ?? 2,
    maxAheadDays: business.maxAheadDays ?? 30,
    cancelWindowHours: business.cancelWindowHours ?? 24,
    bufferTimeMinutes: business.bufferTimeMinutes ?? 0,
    timezone: business.timezone || "Africa/Lagos",
    currencyCode: business.currencyCode || "NGN",
    emailAlertsActive: business.emailAlertsActive ?? true,
    customInvoiceNote: business.customInvoiceNote ?? null,
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl min-h-screen text-foreground transition-colors duration-200">
      <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
        <div className="rounded-xl bg-muted border border-border p-3 shrink-0 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Merchant Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Manage profile information, localization addresses, and active
            metadata for{" "}
            <span className="font-bold text-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-md text-xs font-mono">
              {business.slug}
            </span>
            .
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <SettingsForm business={serializedBusinessForForm} />
        <BookingPolicyForm business={serializedPoliciesForForm} />
      </div>
    </main>
  );
}
