import * as React from "react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SparklesIcon,
  Store,
  Scissors,
  Flower2,
  Sparkle,
  Stethoscope,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BusinessesGrid, { GridItem } from "./BusinessesGrid";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

// Icons live here only (presentation concern), values come from the shared list
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "": <Store className="w-3.5 h-3.5" />,
  SALON: <Scissors className="w-3.5 h-3.5" />,
  SPA: <Flower2 className="w-3.5 h-3.5" />,
  CLINIC: <Sparkle className="w-3.5 h-3.5" />,
  WELLNESS: <Stethoscope className="w-3.5 h-3.5" />,
  OTHER: <MoreHorizontal className="w-3.5 h-3.5" />,
};

const CATEGORIES = [
  { label: "All Providers", value: "" },
  ...BUSINESS_CATEGORIES,
];

export default async function ExplorePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.search?.trim() || "";
  const selectedCategory = resolvedParams.category?.trim().toUpperCase() || "";

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
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedBusinesses: GridItem[] = businesses.map((b) => {
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
          <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
            Browse verified marketplace workspaces near you. Book treatments and
            order products instantly.
          </p>
        </div>

        <div className="flex items-center justify-start md:justify-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
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
                className={`snap-center flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/10"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {CATEGORY_ICONS[cat.value]} <span>{cat.label}</span>
              </Link>
            );
          })}
        </div>

        {normalizedBusinesses.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-muted/20 max-w-xl mx-auto space-y-3">
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
