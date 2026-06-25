import BusinessCard from "@/components/BusinessCard";
import Link from "next/link";

export interface WellnessBusiness {
  id: string;
  name: string;
  slug: string;
  address: string;
  image: string | null;
  description: string | null;
  categories: string[];
  sittingCapacity: number; // Aligned to replace totalChairs from database schema
  isActive: boolean;
  rating?: string;
  totalReviews?: number;
  totalServices?: number;
}

interface BusinessesGridProps {
  search: string;
}

export const dynamic = "force-dynamic";

export default async function BusinessesGrid({ search }: BusinessesGridProps) {
  const searchParam = search ? `?search=${encodeURIComponent(search)}` : "";

  // Hits your new multi-tenant aware internal businesses data router API
  const res = await fetch(
    `http://localhost:3000/api/businesses${searchParam}`,
    {
      cache: "no-store",
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    return (
      <div className="col-span-full py-24 text-center border border-dashed border-border rounded-[2.5rem] bg-card/40 backdrop-blur-md">
        <p className="text-xl font-bold text-foreground">
          Failed to load wellness spaces
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page or try again later.
        </p>
      </div>
    );
  }

  const businesses: WellnessBusiness[] = await res.json();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-32 w-full">
      {businesses.length > 0 ? (
        businesses.map((business) => (
          <Link
            key={business.id}
            href={`/explore/${business.slug}`} // Maps to your app/explore/[slug]/page.tsx viewer
            className="block transition-all hover:scale-[1.01] active:scale-[0.99] group"
          >
            {/* Make sure to rename/create your card component at components/BusinessCard */}
            <BusinessCard business={business} />
          </Link>
        ))
      ) : (
        <div className="col-span-full py-24 text-center border border-dashed border-border rounded-[2.5rem] bg-card/40 backdrop-blur-md">
          <p className="text-xl font-bold text-foreground">
            No wellness spaces found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search for a different provider name, category,
            or location.
          </p>
        </div>
      )}
    </div>
  );
}
