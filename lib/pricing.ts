/**
 * Single source of truth for what an item costs right now.
 *
 * A vendor can put an item on a timed sale (salePrice + saleStartsAt/EndsAt).
 * Checkout always re-derives the price on the server with this helper, so a
 * client can never choose its own price. API routes that serve items to
 * customers also run items through withSalePricing(), which puts the
 * effective price in `price` and the regular price in `originalPrice`, so
 * every existing screen charges and shows the right amount.
 */

export interface SaleFields {
  price: number;
  salePrice?: number | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
}

/** Server-side leeway so a sale that ends while a customer is paying still honours the price they saw. */
export const SALE_END_GRACE_MS = 5 * 60 * 1000;

function toMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function isSaleActive(
  item: SaleFields,
  now: Date = new Date(),
  graceMs = 0,
): boolean {
  const sale = item.salePrice;
  if (typeof sale !== "number" || !(sale > 0) || !(sale < item.price)) {
    return false;
  }
  const start = toMs(item.saleStartsAt);
  const end = toMs(item.saleEndsAt);
  if (end === null) return false; // a sale must always end
  const t = now.getTime();
  if (start !== null && t < start) return false;
  return t < end + graceMs;
}

/** The price to charge. Use graceMs only on the server at checkout. */
export function getEffectivePrice(
  item: SaleFields,
  now: Date = new Date(),
  graceMs = 0,
): number {
  return isSaleActive(item, now, graceMs) ? (item.salePrice as number) : item.price;
}

/**
 * Returns the item with `price` set to the effective price. While on sale,
 * `originalPrice` holds the regular price and `saleEndsAt` the end time.
 */
export function withSalePricing<T extends SaleFields>(
  item: T,
  now: Date = new Date(),
): T & { originalPrice: number | null } {
  if (!isSaleActive(item, now)) {
    return { ...item, originalPrice: null, salePrice: null };
  }
  return {
    ...item,
    price: item.salePrice as number,
    originalPrice: item.price,
  };
}

export interface SaleInput {
  salePrice?: number | null;
  saleStartsAt?: string | Date | null;
  saleEndsAt?: string | Date | null;
}

/** Validates sale fields against the regular price. Returns an error message or null. */
export function validateSale(
  regularPrice: number,
  input: SaleInput,
  now: Date = new Date(),
): string | null {
  if (input.salePrice === null || input.salePrice === undefined) return null;
  if (!(input.salePrice > 0)) return "Sale price must be greater than zero.";
  if (!(input.salePrice < regularPrice)) {
    return "Sale price must be lower than the regular price.";
  }
  const end = toMs(input.saleEndsAt);
  if (end === null) return "Choose when the sale ends.";
  const start = toMs(input.saleStartsAt);
  if (start !== null && end <= start) return "The sale must end after it starts.";
  if (end <= now.getTime()) return "The sale end time must be in the future.";
  return null;
}
