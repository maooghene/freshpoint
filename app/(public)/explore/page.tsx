// app/(public)/explore/page.tsx
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { MapPinIcon, StarIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      address: true,
      categories: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="relative min-h-screen pt-24 pb-32 bg-background text-foreground overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0
          bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)]
          dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]
          bg-[size:4rem_4rem]
          [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full space-y-12">
        {/* HEADER */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">
            <SparklesIcon className="w-3 h-3 mr-1" />
            Discover Providers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Find Your Wellness Space
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
            Browse verified wellness and personal care providers near you. Book
            appointments instantly.
          </p>
        </div>

        {/* GRID */}
        {businesses.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-muted/30">
            <SparklesIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">
              No Providers Yet
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Wellness providers will appear here once they join FreshPoint.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/explore/${business.slug}`}
                className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                {/* IMAGE */}
                <div className="relative aspect-video w-full bg-muted border-b border-border overflow-hidden">
                  <Image
                    src={business.image || "/placeholder-business.jpg"}
                    alt={business.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* INFO */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h2 className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors truncate">
                      {business.name}
                    </h2>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed">
                      {business.description ||
                        "Wellness and personal care provider."}
                    </p>
                  </div>

                  {/* CATEGORIES */}
                  {business.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {business.categories.slice(0, 3).map((cat, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-[10px] font-semibold px-2 rounded-md"
                        >
                          {cat}
                        </Badge>
                      ))}
                      {business.categories.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold px-2 rounded-md"
                        >
                          +{business.categories.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold truncate">
                      <MapPinIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {business.address || "Nigeria"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <StarIcon className="w-3.5 h-3.5 fill-current" />
                      New
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
