"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, ShoppingBagIcon } from "lucide-react";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";

import { ServiceCatalogGrid } from "@/components/ServiceCatalogGrid";
import { ProductCatalogGrid } from "@/components/ProductCatalogGrid";
import { BusinessProfileHeader } from "@/components/BusinessProfileHeader";
import { BusinessReviewList } from "@/components/BusinessReviewList";

interface UnifiedItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: "SERVICE" | "PRODUCT";
  image: string | null;
  duration: number | null;
  stock: number | null;
  businessId: string;
}

interface BusinessProfileInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  address: string;
  email: string;
  phone: string;
  categories: string[] | null;
  isActive: boolean;
  rating?: number | string;
  reviewCount?: number;
}

export default function BusinessProfile() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();

  const [businessInfo, setBusinessInfo] = useState<BusinessProfileInfo | null>(
    null,
  );
  const [services, setServices] = useState<UnifiedItem[]>([]);
  const [products, setProducts] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const fetchWorkspaceData = async () => {
      try {
        const cleanSlug = decodeURIComponent(slug);
        const res = await fetch(`/api/businesses/slug/${cleanSlug}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (isMounted) setBusinessInfo(null);
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        setBusinessInfo({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          image: data.image,
          address: data.address,
          email: data.email,
          phone: data.phone,
          categories: data.categories || [],
          isActive: data.isActive,
          rating: data.rating || "New",
          reviewCount: data.totalReviews || 0,
        });

        const allItems: UnifiedItem[] = data.items || [];
        setServices(allItems.filter((item) => item.type === "SERVICE"));
        setProducts(allItems.filter((item) => item.type === "PRODUCT"));
      } catch (error) {
        console.error("Error loading profile:", error);
        if (isMounted) setBusinessInfo(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchWorkspaceData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) return <Loading />;

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
        <div className="space-y-4 max-w-sm">
          <h2 className="text-2xl font-black tracking-tight">
            Workspace Not Found
          </h2>
          <Button
            onClick={() => router.push("/explore")}
            variant="outline"
            className="rounded-xl w-full"
          >
            <ArrowLeftIcon className="mr-2 size-4" /> Return to Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-24 bg-background text-foreground">
      {/* Background vectors */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full">
        <button
          onClick={() => router.push("/explore")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Providers
        </button>

        {/* 1. Header Card Building Block */}
        <BusinessProfileHeader
          id={businessInfo.id}
          name={businessInfo.name}
          image={businessInfo.image}
          description={businessInfo.description}
          rating={businessInfo.rating || "New"}
          reviewCount={businessInfo.reviewCount || 0}
          categories={businessInfo.categories}
          address={businessInfo.address}
          email={businessInfo.email}
        />

        {/* 2. Catalog Content Presentation Sections */}
        <div className="space-y-16">
          {services.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight">
                Available Treatments & Services
              </h2>
              <ServiceCatalogGrid services={services} />
            </div>
          )}

          {products.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <ShoppingBagIcon className="w-5 h-5 text-primary" /> Available
                Products
              </h2>
              <ProductCatalogGrid products={products} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
