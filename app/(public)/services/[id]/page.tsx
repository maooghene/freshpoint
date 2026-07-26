"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Aligned cleanly with your central Prisma Item configuration setup
interface UnifiedItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: "SERVICE" | "PRODUCT";
  image: string | null;
  duration: number | null;
  businessId: string;
  business?: {
    name: string;
    slug: string;
  };
}

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const [service, setService] = useState<UnifiedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        if (!id) {
          setError("Invalid structural service link");
          setLoading(false);
          return;
        }

        // Targets your central multi-tenant unified inventory route
        const res = await fetch(`/api/items/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const text = await res.text();

        if (!res.ok) {
          throw new Error(text || "Failed to fetch workspace treatment spec");
        }

        const data: UnifiedItem = JSON.parse(text);
        setService(data);
      } catch (err) {
        console.error("Fetch execution error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load treatment specs",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading session parameters...
          </p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-background text-foreground px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-destructive font-medium text-lg">
            {error || "Service treatment profile unavailable."}
          </p>
          <Button
            onClick={() => router.push("/explore")}
            variant="outline"
            className="w-full font-semibold rounded-xl border-border"
          >
            <ArrowLeft className="mr-2 size-4" /> Return to Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-20 bg-background text-foreground">
      {/* BULLETPROOF BACKGROUND GRID PATTERNS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
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

      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* REBRANDED MULTI-TENANT BREADCRUMB MATRIX */}
        <nav className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mt-8 mb-10">
          <Link
            href="/"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <HomeIcon size={12} /> Home
          </Link>
          <ChevronRightIcon size={12} className="text-muted-foreground/40" />
          <Link
            href="/explore"
            className="hover:text-primary transition-colors"
          >
            Explore
          </Link>
          {service.business && (
            <>
              <ChevronRightIcon
                size={12}
                className="text-muted-foreground/40"
              />
              <Link
                href={`/explore/${service.business.slug}`}
                className="hover:text-primary transition-colors"
              >
                {service.business.name}
              </Link>
            </>
          )}
          <ChevronRightIcon size={12} className="text-muted-foreground/40" />
          <span className="text-primary truncate max-w-[200px]">
            {service.name}
          </span>
        </nav>

        {/* COMPREHENSIVE TEXT METADATA SHEET CONTAINER */}
        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-12 shadow-xs">
          {/* Make sure your child component at components/ServiceDescription accepts unified UnifiedItem types */}
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {service.name}
            </h1>
            <p className="text-xl font-black text-primary">
              ₦{service.price.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {service.description ||
                "No structural profile summaries supplied yet by the workspace provider."}
            </p>
            {service.duration && (
              <div className="text-xs font-semibold text-foreground bg-muted w-fit px-3 py-1.5 rounded-lg">
                Session Length: {service.duration} minutes
              </div>
            )}
            <div className="pt-6">
              <Button
                asChild
                size="lg"
                className="rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Link href={`/book/${service.id}`}>Book Session Opening</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
