import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { LocationsManager } from "./LocationsManager";
import { MapPin } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function LocationsPage({ params }: PageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      owner: true,
      locations: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!business) {
    notFound();
  }

  if (business.owner.clerkId !== userId) {
    redirect("/dashboard");
  }

  const serializedBusinessForForm = {
    id: business.id,
    slug: business.slug,
    subscriptionTier: business.subscriptionTier,
  };

  const serializedLocations = business.locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    deliveryRadiusKm: loc.deliveryRadiusKm,
    isPrimary: loc.isPrimary,
    isActive: loc.isActive,
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl min-h-screen text-foreground transition-colors duration-200">
      <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
        <div className="rounded-xl bg-muted border border-border p-3 shrink-0 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Manage the physical branches customers can book or order from for{" "}
            <span className="font-bold text-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-md text-xs font-mono">
              {business.slug}
            </span>
            .
          </p>
        </div>
      </div>

      <LocationsManager
        business={serializedBusinessForForm}
        locations={serializedLocations}
      />
    </main>
  );
}
