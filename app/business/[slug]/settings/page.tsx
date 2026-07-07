import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
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

  // Include the relational user record to access the clerkId configuration safely
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      owner: true,
    },
  });

  if (!business) {
    notFound();
  }

  // Guard routing context strictly by mapping via the resolved relation
  if (business.owner.clerkId !== userId) {
    redirect("/dashboard");
  }

  // 💡 TYPE RECONCILIATION: Extract exactly what the form expects to prevent lint errors
  const serializedBusinessForForm = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    phone: business.phone ?? "",
    address: business.address ?? "",
    // Fall back to models or metadata variables safely
    sittingCapacity:
      (business as unknown as { sittingCapacity?: number }).sittingCapacity ??
      1,
    categories:
      (business as unknown as { categories?: string[] }).categories ?? [],
    description: business.description ?? null,
    image: business.imageUrl ?? null, // Map from model property to shape token
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl min-h-screen text-foreground transition-colors duration-200">
      {/* 💡 THEME ADAPTIVE HEADER BLOCK */}
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
        {/* Pass down the sanitized, theme-adaptive configuration safely to our component */}
        <SettingsForm business={serializedBusinessForForm} />
      </div>
    </main>
  );
}
