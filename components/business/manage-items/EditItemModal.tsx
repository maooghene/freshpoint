import { X } from "lucide-react";
import { EditForm, ServiceItem, ProductItem } from "./types";

export function EditItemModal({
  item,
  form,
  onChange,
  onSubmit,
  onClose,
}: {
  item: ServiceItem | ProductItem;
  form: EditForm;
  onChange: (updated: EditForm) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const field = (key: keyof EditForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [key]: e.target.value }),
  });

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-background";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl border border-primary/10 shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h3 className="text-lg font-semibold">
            Edit {item.type === "SERVICE" ? "Service" : "Product"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">
              Name
            </label>
            <input
              type="text"
              {...field("name")}
              placeholder="Enter name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">
              Description
            </label>
            <textarea
              {...field("description")}
              rows={3}
              placeholder="Brief description..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Price (₦)
              </label>
              <input type="number" {...field("price")} className={inputClass} />
            </div>
            {item.type === "SERVICE" ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  {...field("duration")}
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  {...field("stock")}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {item.type === "PRODUCT" && (
            <div className="space-y-4 pt-1 border-t border-primary/5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest pt-2">
                Inventory Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    {...field("sku")}
                    placeholder="e.g. PROD-001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    {...field("costPrice")}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="w-1/2 pr-2">
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  {...field("weight")}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-primary/10 hover:bg-muted font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
