// app/api/orders/confirm/utils.ts
export interface CheckoutPayloadItem {
  itemId: string;
  quantity: number;
  // NOT trusted for pricing/order totals as of the price-verification fix
  // in route.ts — the real price is always resolved server-side from
  // Item.price inside the transaction. This field is only read as a
  // best-effort fallback when building the audit record on the
  // insufficient-stock / price-mismatch refund paths, where the order is
  // never actually fulfilled anyway.
  price: number;
}
export interface CheckoutRequestBody {
  reference: string;
  businessId: string;
  items: CheckoutPayloadItem[];
  // NOT trusted for order totals — kept in the type only because existing
  // client code still sends it; route.ts ignores this field entirely and
  // computes the real total server-side. Safe to stop sending this from the
  // client whenever convenient; nothing server-side depends on it anymore.
  totalAmount?: number;
  isDelivery?: boolean;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryNotes?: string;
  deliveryFee?: number;
  customerPhone?: string; // Appended for emergency contact routing
}
export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    reference: string;
  };
}
/**
 * Senior type-safe friendly random code generator (FP-YYMM-XXXXX format)
 * Employs 32 clean uppercase characters to eliminate human visual interpretation error.
 */
export function createSecureTrackCode(): string {
  const characters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPayload = "";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPayload += characters.charAt(randomIndex);
  }
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const monthRaw = now.getMonth() + 1;
  const monthShort = monthRaw < 10 ? `0${monthRaw}` : String(monthRaw);
  return `FP-${yearShort}${monthShort}-${randomPayload}`;
}
