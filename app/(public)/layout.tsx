"use client";

import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AiSupportWidget } from "@/components/AiSupportWidget";
import { AnnouncementsDisplay } from "@/components/announcements/AnnouncementsDisplay";
import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { useAppDispatch } from "@/lib/store";
import { fetchItemsByBusiness } from "@/lib/features/itemSlice";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const params = useParams();
  const pathname = usePathname();

  const [resolvedBusinessId, setResolvedBusinessId] = useState<
    string | undefined
  >();

  // Only "explore/[slug]" reliably identifies a specific business by slug.
  // Other [id] segments (book/[id], products/[id], services/[id]) refer to
  // items, not businesses, so we don't treat them as a businessId.
  const isExploreRoute = pathname?.startsWith("/explore/");
  const slugParam = isExploreRoute
    ? (params?.slug as string | undefined)
    : undefined;

  useEffect(() => {
    if (!slugParam) {
      setResolvedBusinessId(undefined);
      return;
    }

    let isMounted = true;
    fetch(`/api/businesses/slug/${slugParam}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.id) setResolvedBusinessId(String(data.id));
      })
      .catch((err) => console.error("Failed to resolve business id:", err));

    return () => {
      isMounted = false;
    };
  }, [slugParam]);

  // Existing item-fetch logic — left as-is aside from using the resolved id
  // rather than the raw (and sometimes wrong) params.id/params.slug value.
  useEffect(() => {
    if (resolvedBusinessId) {
      dispatch(fetchItemsByBusiness(resolvedBusinessId));
    }
  }, [dispatch, resolvedBusinessId]);

  return (
    <>
      <Banner />
      <Navbar />
      <main className="flex-1 pt-16 pb-20 bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <AnnouncementsDisplay businessId={resolvedBusinessId} />
        </div>
        {children}
      </main>
      <Footer />

      <AiSupportWidget />
    </>
  );
}
