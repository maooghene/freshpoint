import Image from "next/image";
import { PackageIcon } from "lucide-react";
import { toast } from "react-toastify";
import { ProductItem } from "./types";
import { ToggleSwitch } from "./ToggleSwitch";
import { ItemActions } from "./ItemActions";

export function ProductsTable({
  products,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: {
  products: ProductItem[];
  currency: string;
  onToggle: (id: string, type: "PRODUCT") => Promise<void>;
  onEdit: (item: ProductItem) => void;
  onDelete: (id: string, type: "PRODUCT") => Promise<void>;
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Your{" "}
        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Products
        </span>
      </h2>
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-background/40 backdrop-blur-md shadow-xl max-w-5xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-primary/5 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Product Details</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 text-foreground">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-primary/5 transition-colors group"
              >
                <td className="px-6 py-4 flex gap-4 items-center">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-primary/10 bg-primary/5 flex items-center justify-center shrink-0">
                    {product.image ? (
                      <Image
                        fill
                        src={product.image}
                        alt={product.name}
                        className="object-cover"
                      />
                    ) : (
                      <PackageIcon size={20} className="text-primary/40" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold tracking-tight">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[220px] hidden sm:block">
                      {product.description || "No description"}
                    </p>
                    {product.sku && (
                      <p className="text-[10px] text-muted-foreground/60 hidden sm:block">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{product.stock ?? 0}</td>
                <td className="px-6 py-4 font-black text-primary">
                  {currency}
                  {product.price.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <ToggleSwitch
                    checked={product.isActive}
                    onChange={() =>
                      toast.promise(onToggle(product.id, "PRODUCT"), {
                        pending: "Updating...",
                        success: "Status updated",
                        error: "Failed to update",
                      })
                    }
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <ItemActions
                    onEdit={() => onEdit(product)}
                    onDelete={() =>
                      toast.promise(onDelete(product.id, "PRODUCT"), {
                        pending: "Deleting...",
                        success: "Product deleted",
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
