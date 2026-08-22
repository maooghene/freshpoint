import * as React from "react";
import Link from "next/link";
import { Prisma, SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SparklesIcon,
  Store,
  Scissors,
  Flower2,
  Sparkle,
  Stethoscope,
  MoreHorizontal,
  Tag, // ADDED: fallback icon for admin-created categories not in the map below
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BusinessesGrid, { GridItem } from "./BusinessesGrid";
import { getBusinessCategories } from "@/lib/actions/admin-categories"; // CHANGED: was static import from "@/lib/categories"
import { compareTierRank, isFeaturedTier } from "@/lib/subscription-tiers";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

// Icons for known/legacy categories. Anything not listed here falls back to <Tag />.
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "": <Store className="w-3.5 h-3.5" />,
  SALON: <Scissors className="w-3.5 h-3.5" />,
  SPA: <Flower2 className="w-3.5 h-3.5" />,
  CLINIC: <Sparkle className="w-3.5 h-3.5" />,
  WELLNESS: <Stethoscope className="w-3.5 h-3.5" />,
  OTHER: <MoreHorizontal className="w-3.5 h-3.5" />,
};

export default async function ExplorePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.search?.trim() || "";
  const selectedCategory = resolvedParams.category?.trim().toUpperCase() || "";

  // ADDED: pull live, active categories set by admin instead of the static array
  const businessCategories = await getBusinessCategories();
  const activeCategories = businessCategories
    .filter((c) => c.isActive)
    .map((c) => ({ label: c.label, value: c.value }));

  const CATEGORIES = [
    { label: "All Providers", value: "" },
    ...activeCategories,
  ];

  const baseConditions: Prisma.BusinessWhereInput[] = [
    {
      status: {
        in: [
          "approved",
          "verified",
          "APPROVED",
          "VERIFIED",
          "Approved",
          "Verified",
          "active",
          "ACTIVE",
        ],
      },
    },
  ];

  if (selectedCategory) {
    baseConditions.push({
      categories: {
        hasSome: [selectedCategory],
      },
    });
  }

  if (searchQuery) {
    baseConditions.push({
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { slug: { contains: searchQuery, mode: "insensitive" } },
      ],
    });
  }

  const businesses = await prisma.business.findMany({
    where: { AND: baseConditions },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      address: true,
      status: true,
      categories: true,
      subscriptionTier: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Featured placement: Growth/Pro businesses rank above Starter, then by
  // original createdAt-desc order within each tier group. Done in
  // application code since ranking by an enum's "importance" rather than
  // its literal value isn't expressible in a single Prisma orderBy clause.
  const sortedBusinesses = [...businesses].sort((a, b) =>
    compareTierRank(
      a.subscriptionTier as SubscriptionTier,
      b.subscriptionTier as SubscriptionTier,
    ),
  );

  const normalizedBusinesses: GridItem[] = sortedBusinesses.map((b) => {
    const validCategories = Array.isArray(b.categories)
      ? b.categories.filter((c) => typeof c === "string" && c.trim().length > 0)
      : [];

    const displayedCategory =
      validCategories.length > 0 ? validCategories[0] : "Shop";

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      image: b.image,
      address: b.address,
      status: b.status,
      category: displayedCategory,
      isFeatured: isFeaturedTier(b.subscriptionTier as SubscriptionTier),
    };
  });

  return (
    <div className="relative min-h-screen pt-24 pb-32 bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">
            <SparklesIcon className="w-3 h-3 mr-1" /> Discover Providers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Explore Providers & Products
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-baseleading-relaxed">
            Browse verified marketplace workspaces near you. Book treatments and
            order products instantly.
          </p>
        </div>

        <div className="flex items-center justify-start gap-2.5 overflow-x-auto pb-3 pt-1 px-1 -mx-1 scrollbar-none snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const queryString = new URLSearchParams();
            if (searchQuery) queryString.set("search", searchQuery);
            if (cat.value) queryString.set("category", cat.value);
            const finalHref = `/explore${queryString.toString() ? `?${queryString.toString()}` : ""}`;

            return (
              <Link
                key={cat.label}
                href={finalHref}
                className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/10"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {CATEGORY_ICONS[cat.value] ?? <Tag className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </Link>
            );
          })}
        </div>

        {normalizedBusinesses.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-borderrounded-2xl bg-muted/20 max-w-xl mx-auto space-y-3">
            <Store className="mx-auto w-10 h-10 text-muted-foreground/30 animate-pulse" />
            <h3 className="text-base font-bold text-foreground">
              {searchQuery || selectedCategory
                ? "No matches found"
                : "No Providers Available"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto px-4 font-medium">
              We couldn&apos;t find any verified providers matching your
              selected parameters filters.
            </p>
            <div className="pt-2">
              <Link
                href="/explore"
                className="text-xs font-bold text-primary underline underline-offset-4"
              >
                Reset all filters
              </Link>
            </div>
          </div>
        ) : (
          <BusinessesGrid businesses={normalizedBusinesses} />
        )}
      </div>
    </div>
  );
}
