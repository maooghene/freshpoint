"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, ImageIcon, BadgeCheck, Tag } from "lucide-react";

export interface GridItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null; // ✅ already a fully-resolved URL from the API, or null
  address: string | null;
  status: string | null;
  category: string;
  /** Category label this shop is listed under only as an extra, else null. */
  alsoOffers?: string | null;
  isSponsored: boolean;
}

/**
 * Glovo-style vendor cards: image first, rounded, with the name and a single
 * muted info line underneath. One column on phones so each shop gets a big,
 * easy-to-tap picture; two on tablets, more on desktop.
 */
export default function BusinessesGrid({
  businesses,
}: {
  businesses: GridItem[];
}) {
  return (
    <div className="grid grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 sm:gap-x-5 sm:gap-y-8">
      {businesses.map((business: GridItem) => {
        const status = business.status?.trim().toLowerCase();
        const isApproved = status === "approved" || status === "verified";

        return (
          <Link
            key={business.id}
            href={`/explore/${business.slug}`}
            className="group flex flex-col gap-2.5 rounded-2xl active:scale-[0.99] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
              {business.image ? (
                <Image
                  src={business.image}
                  alt={business.name}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 560px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}

              {/* Soft bottom fade so the pills stay readable on any photo */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />

              {business.isSponsored && (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 shadow-sm">
                  Sponsored
                </span>
              )}

              <span className="absolute bottom-2.5 left-2.5 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-bold capitalize text-foreground shadow-sm">
                {business.category.toLowerCase()}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 space-y-0.5 px-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="truncate text-base font-extrabold leading-tight text-foreground group-hover:text-primary transition-colors">
                  {business.name}
                </h2>
                {isApproved && (
                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-emerald-500"
                    aria-label="Verified"
                  />
                )}
              </div>

              <p className="line-clamp-1 text-[13px] font-medium text-muted-foreground">
                {business.description ||
                  "Services and products from a trusted local provider."}
              </p>

              {business.alsoOffers && (
                <p className="flex items-center gap-1 text-xs font-bold text-primary">
                  <Tag className="h-3 w-3 shrink-0" />
                  Also offers {business.alsoOffers}
                </p>
              )}

              <div className="flex items-center gap-1 pt-0.5 text-xs font-semibold text-muted-foreground min-w-0">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{business.address || "Nigeria"}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
