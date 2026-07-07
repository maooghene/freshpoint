export interface ItemDetails {
  name: string;
  image: string | null;
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  item: ItemDetails;
}

export interface BusinessDetails {
  name: string;
  phone: string | null;
  address: string | null;
}

export interface OrderData {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryNotes?: string | null;
  business: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  items: OrderItem[];
}

