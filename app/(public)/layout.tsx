"use client";

import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/lib/store"; // FIXED: Uses type-safe custom hook from central store
import { fetchItemsByBusiness } from "@/lib/features/itemSlice"; // FIXED: Uses unified item handler

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const params = useParams();

  // Safely extract the active tenant identifier from either path segments or subdomains
  const businessId = (params?.id || params?.slug) as string | undefined;

  useEffect(() => {
    if (businessId) {
      // Scopes the query to isolate items belonging to this specific business tenant
      dispatch(fetchItemsByBusiness(businessId));
    }
  }, [dispatch, businessId]);

  return (
    <>
      <Banner />
      <Navbar />
      <main className="flex-1 pt-16 pb-20 bg-background text-foreground">
        {children}
      </main>
      <Footer />
    </>
  );
}
