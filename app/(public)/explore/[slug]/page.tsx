"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MailIcon,
  MapPinIcon,
  StarIcon,
  ArrowLeftIcon,
  ClockIcon,
  ShoppingBagIcon,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  categories: string[];
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchWorkspaceData = async () => {
      try {
        const cleanSlug = decodeURIComponent(slug);
        const res = await fetch(`/api/businesses/slug/${cleanSlug}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setBusinessInfo(null);
          return;
        }

        const data = await res.json();

        setBusinessInfo({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          image: data.image,
          address: data.address,
          email: data.email,
          phone: data.phone,
          categories: data.categories,
          isActive: data.isActive,
          rating: data.rating || "New",
          reviewCount: data.totalReviews || 0,
        });

        const allItems: UnifiedItem[] = data.items || [];
        setServices(allItems.filter((item) => item.type === "SERVICE"));
        setProducts(allItems.filter((item) => item.type === "PRODUCT"));
      } catch (error) {
        console.error("Error loading Freshpoint workspace profile:", error);
        setBusinessInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [slug]);

  if (loading) return <Loading />;

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background text-foreground">
        <div className="space-y-4 max-w-sm">
          <h2 className="text-2xl font-black tracking-tight">
            Workspace Not Found
          </h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            The wellness space or provider profile you are looking for does not
            exist or has changed locations.
          </p>
          <Button
            onClick={() => router.push("/explore")}
            variant="outline"
            className="rounded-xl w-full font-semibold"
          >
            <ArrowLeftIcon className="mr-2 size-4" /> Return to Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-24 bg-background text-foreground">
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

      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/explore")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Providers
        </button>

        {/* BUSINESS HEADER */}
        <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-xl mb-16">
          <div className="relative shrink-0 w-44 h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden border border-border bg-muted">
            <Image
              src={businessInfo.image || "/placeholder-business.jpg"}
              alt={businessInfo.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="text-center md:text-left flex-1 space-y-4 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground truncate">
                {businessInfo.name}
              </h1>
              <Badge className="w-fit mx-auto md:mx-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-3 flex items-center gap-1">
                <StarIcon className="w-3 h-3 fill-current" />
                {businessInfo.rating} ({businessInfo.reviewCount} reviews)
              </Badge>
            </div>

            <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm md:text-base">
              {businessInfo.description ||
                "No description configured yet for this wellness venue."}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
              {businessInfo.categories.map((category, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-[11px] font-semibold px-2.5 rounded-md"
                >
                  {category}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 pt-4 border-t border-border">
              <div className="flex items-center text-xs font-bold text-muted-foreground">
                <MapPinIcon className="w-4 h-4 text-primary mr-1.5 shrink-0" />
                <span className="text-foreground/90 truncate">
                  {businessInfo.address}
                </span>
              </div>
              <div className="flex items-center text-xs font-bold text-muted-foreground">
                <MailIcon className="w-4 h-4 text-primary mr-1.5 shrink-0" />
                <span className="text-foreground/90 truncate">
                  {businessInfo.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION A: SERVICES ===== */}
        <div className="space-y-8 mb-20">
          <div className="text-center space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Available Treatments & Services
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Select a premium treatment option below to reserve an opening on
              our live provider schedule.
            </p>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/30 transition-all group duration-300"
                >
                  <div className="relative aspect-video w-full bg-muted border-b border-border overflow-hidden">
                    <Image
                      src={service.image || "/placeholder-service.jpg"}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                        {service.description ||
                          "No description provided for this treatment."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Price Rate
                        </p>
                        <p className="font-black text-foreground text-base">
                          ₦{service.price.toLocaleString()}
                        </p>
                      </div>
                      {service.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                          <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                          {service.duration} mins
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => router.push(`/book/${service.id}`)}
                      className="w-full rounded-xl font-bold text-sm gap-2"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Book Appointment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
              <Sparkles className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-bold text-foreground mb-1">
                No Services Listed Yet
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                This provider hasn&apos;t added any treatments or services yet.
              </p>
            </div>
          )}
        </div>

        {/* ===== SECTION B: PRODUCTS ===== */}
        <div className="space-y-8 mb-24">
          <div className="text-center space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              <ShoppingBagIcon className="w-6 h-6 text-primary" />
              Available Products
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Explore wellness and beauty products available from this provider.
            </p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="cursor-pointer flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/30 transition-all group duration-300"
                >
                  <div className="relative aspect-square w-full bg-muted border-b border-border overflow-hidden">
                    <Image
                      src={product.image || "/placeholder-product.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground text-base tracking-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                        {product.description ||
                          "No description available for this product."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <p className="font-black text-primary text-base">
                        ₦{product.price.toLocaleString()}
                      </p>
                      {product.stock !== null && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            product.stock > 0
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {product.stock > 0
                            ? `${product.stock} in stock`
                            : "Out of stock"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
              <ShoppingBagIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-bold text-foreground mb-1">
                No Products Listed Yet
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                This provider hasn&apos;t added any products yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
