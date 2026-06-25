import Image from "next/image";
import { ScissorsIcon } from "lucide-react";
import { toast } from "react-toastify";
import { ServiceItem } from "./types";
import { ToggleSwitch } from "./ToggleSwitch";
import { ItemActions } from "./ItemActions";

export function ServicesTable({
  services,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: {
  services: ServiceItem[];
  currency: string;
  onToggle: (id: string, type: "SERVICE") => Promise<void>;
  onEdit: (item: ServiceItem) => void;
  onDelete: (id: string, type: "SERVICE") => Promise<void>;
}) {
  if (services.length === 0)
    return <p className="text-muted-foreground">No services added yet.</p>;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Your{" "}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Services
        </span>
      </h2>
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-background/40 backdrop-blur-md shadow-xl max-w-5xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-primary/5 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Service Details</th>
              <th className="px-6 py-4 hidden md:table-cell">Duration</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 text-foreground">
            {services.map((service) => (
              <tr
                key={service.id}
                className="hover:bg-primary/5 transition-colors group"
              >
                <td className="px-6 py-4 flex gap-4 items-center">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-primary/10 bg-primary/5 flex items-center justify-center shrink-0">
                    {service.image ? (
                      <Image
                        fill
                        src={service.image}
                        alt={service.name}
                        className="object-cover"
                      />
                    ) : (
                      <ScissorsIcon size={20} className="text-primary/40" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold tracking-tight">{service.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[220px] hidden sm:block">
                      {service.description || "No description"}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  {service.duration} mins
                </td>
                <td className="px-6 py-4 font-black text-primary">
                  {currency}
                  {service.price.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <ToggleSwitch
                    checked={service.isActive}
                    onChange={() =>
                      toast.promise(onToggle(service.id, "SERVICE"), {
                        pending: "Updating...",
                        success: "Status updated",
                        error: "Failed to update",
                      })
                    }
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <ItemActions
                    onEdit={() => onEdit(service)}
                    onDelete={() =>
                      toast.promise(onDelete(service.id, "SERVICE"), {
                        pending: "Deleting...",
                        success: "Service deleted",
                        error: "Failed to delete",
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
