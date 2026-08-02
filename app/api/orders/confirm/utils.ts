// app/api/orders/confirm/utils.ts
export interface CheckoutPayloadItem {
  itemId: string;
  quantity: number;
  price: number;
}

export interface CheckoutRequestBody {
  reference: string;
  businessId: string;
  items: CheckoutPayloadItem[];
  totalAmount: number;
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
