"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BusinessCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  address: string | null;
  status: string | null;
  category: string | null;
}

interface BusinessesGridProps {
  businesses: BusinessCard[];
}

export default function BusinessesGrid({ businesses }: BusinessesGridProps) {
  const resolveImageSource = (savedPath: string | null) => {
    if (!savedPath || savedPath.trim().length === 0) return "/placeholder-business.jpg";
    if (savedPath.startsWith("http://") || savedPath.startsWith("https://")) return savedPath;
    return `https://imagekit.io{savedPath.replace(/^\//, "")}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {businesses.map((business) => {
        const isApproved =
          business.status?.trim().toLowerCase() === "approved" ||
          business.status?.trim().toLowerCase() === "verified";

        return (
          <Link
            key={business.id}
            href={`/explore/${business.slug}`}
            className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:border-primary/30 transition-all duration-300"
          >
            {/* Image Layer */}
            <div className="relative aspect-video w-full bg-muted border-b border-border overflow-hidden">
              <Image
                src={resolveImageSource(business.image)}
                alt={business.name}
                fill
                sizes="(max-w-7xl) 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Info Layer */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 justify-between min-w-0">
                  <h2 className="font-black text-foreground text-base tracking-tight group-hover:text-primary transition-colors truncate flex-1">
                    {business.name}
                  </h2>
                  {isApproved && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] px-1.5 py-0.5 rounded shrink-0">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed">
                  {business.description || "Premium service treatment and product provider."}
                </p>
              </div>

              {/* Compact Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold truncate flex-1 min-w-0">
                  <MapPinIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{business.address || "Nigeria"}</span>
                </div>
                
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-0.5 rounded-md border border-primary/10">
                  {business.category?.toLowerCase() || "Shop"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
