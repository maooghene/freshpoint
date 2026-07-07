"use client";

import * as React from "react";
import Image from "next/image";
// 💡 FIXED: Removed Badge from lucide-react to prevent icon attribute collisions
import { Sparkles, Clock } from "lucide-react";
import { toast } from "react-toastify";
// 💡 FIXED: Imported your true custom UI Badge component cleanly
import { Badge } from "@/components/ui/badge";
import { ServiceItem } from "./types";
import { ItemActions } from "./ItemActions";

interface ServicesTableProps {
  services: ServiceItem[];
  currency: string;
  onToggle: (id: string, type: "SERVICE") => Promise<void>;
  onEdit: (item: ServiceItem) => void;
  onDelete: (id: string, type: "SERVICE") => Promise<void>;
}

export function ServicesTable({
  services,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: ServicesTableProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border/40 bg-card/20 rounded-2xl text-base font-semibold text-muted-foreground max-w-5xl mx-auto">
        No services added yet. Click &apos;+ Add New Item&apos; above to get
        started.
      </div>
    );
  }

  return (
    <section className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border/30 pb-2">
        <h2 className="text-xl font-black text-foreground/90 tracking-wide">
          Services & Treatments
        </h2>
        {/* 💡 NOW SAFE: Your Shadcn badge component handles the variant correctly */}
        <Badge
          variant="secondary"
          className="font-bold text-xs bg-primary/10 text-primary border-none"
        >
          {services.length} Total
        </Badge>
      </div>

      {/* overflow-x-auto injects a side scrollbar for small mobile screens */}
      <div className="w-full overflow-x-auto rounded-2xl border border-border/50 bg-background/40 backdrop-blur-md shadow-xl scrollbar-thin scrollbar-thumb-border">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-muted/40 text-muted-foreground/80 text-xs uppercase tracking-widest font-black border-b border-border/40 select-none">
            <tr>
              <th className="px-6 py-4.5 min-w-[300px]">Service Details</th>
              <th className="px-6 py-4.5 w-32">Duration</th>
              <th className="px-6 py-4.5 w-36">Price Rate</th>
              <th className="px-6 py-4.5 w-32">Status</th>
              <th className="px-6 py-4.5 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-foreground/90">
            {services.map((service: ServiceItem) => (
              <tr
                key={service.id}
                className="hover:bg-muted/30 transition-colors duration-150 group"
              >
                {/* DETAILS COLUMN */}
                <td className="px-6 py-4 flex gap-4 items-center min-w-[300px]">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border/40 bg-muted/40 flex items-center justify-center shrink-0 shadow-xs">
                    {service.image ? (
                      <Image
                        fill
                        src={service.image}
                        alt={service.name}
                        className="object-cover opacity-90"
                        sizes="48px"
                      />
                    ) : (
                      <Sparkles size={16} className="text-primary/50" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold text-base text-foreground/90 tracking-wide truncate max-w-[220px]">
                      {service.name}
                    </p>
                    <p className="text-sm text-muted-foreground/80 line-clamp-1 max-w-[260px] font-normal tracking-wide">
                      {service.description || "No description provided."}
                    </p>
                  </div>
                </td>

                {/* DURATION COLUMN */}
                <td className="px-6 py-4 font-bold text-sm text-muted-foreground/80 tracking-wide whitespace-nowrap">
                  {service.duration} mins
                </td>

                {/* PRICE COLUMN */}
                <td className="px-6 py-4 font-black text-primary/90 text-base tracking-wide whitespace-nowrap">
                  {currency}
                  {service.price.toLocaleString()}
                </td>

                {/* EMERALD TOGGLE LIGHT COLUMN */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() =>
                      void toast.promise(onToggle(service.id, "SERVICE"), {
                        pending: "Updating status...",
                        success: "Visibility synced",
                        error: "Failed to update",
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer select-none ${
                      service.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs shadow-emerald-500/5"
                        : "bg-muted/40 text-muted-foreground/70 border-border/60"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full transition-all ${
                        service.isActive
                          ? "bg-emerald-400 animate-pulse ring-4 ring-emerald-400/10"
                          : "bg-muted-foreground/40"
                      }`}
                    />
                    <span>{service.isActive ? "Live" : "Hidden"}</span>
                  </button>
                </td>

                {/* ACTIONS BUTTON CELL */}
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <ItemActions
                    onEdit={() => onEdit(service)}
                    onDelete={() =>
                      void toast.promise(onDelete(service.id, "SERVICE"), {
                        pending: "Deleting...",
                        success: "Service entry removed",
                        error: "Purge process failed",
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
