// components/checkout/settings/types.ts
export interface ItemDetails {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  business: {
    id: string;
    name: string;
  };
}
