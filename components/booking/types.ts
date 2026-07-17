// components/booking/types.ts

export interface LocalBookingTableData {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  locationType: "IN_SHOP" | "OUT_CALL" | string;
  notes: string | null;
  queueCode: string | null;
  totalAmount: number | null;
  business: {
    id: string;
    name: string;
    address: string;
    phone: string | null;
  } | null;
  address?: {
    id: string;
    street: string;
    city: string;
  } | null;
}
