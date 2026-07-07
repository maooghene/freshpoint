"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ClockIcon, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  image: string | null;
}

interface ServiceCatalogGridProps {
  services: ServiceItem[];
}

export function ServiceCatalogGrid({ services }: ServiceCatalogGridProps) {
  const router = useRouter();

  if (services.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/30">
        <Sparkles className="mx-auto w-10 h-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-bold text-foreground mb-1">
          No Services Listed Yet
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          This provider hasn&apos;t added any treatments or services yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service: ServiceItem) => (
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
              className="w-full rounded-xl font-bold text-sm gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Book Appointment
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
