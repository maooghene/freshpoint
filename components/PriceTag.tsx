import { cn } from "@/lib/utils";

/**
 * Shows a price, and when the item is on sale also the regular price struck
 * through. `price` is already the amount charged (see lib/pricing.ts).
 */
export function PriceTag({
  price,
  originalPrice,
  className,
}: {
  price: number;
  originalPrice?: number | null;
  className?: string;
}) {
  const onSale =
    typeof originalPrice === "number" && originalPrice > price;
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span>₦{price.toLocaleString()}</span>
      {onSale && (
        <>
          <span className="text-[0.75em] font-semibold text-muted-foreground line-through">
            ₦{originalPrice.toLocaleString()}
          </span>
          <span className="rounded bg-destructive/10 px-1 py-0.5 text-[0.65em] font-bold text-destructive">
            -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </span>
        </>
      )}
    </span>
  );
}
