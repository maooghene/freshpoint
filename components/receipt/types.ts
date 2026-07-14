export interface ItemDetails {
  name: string;
  image: string | null;
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item: ItemDetails;
}

export interface BusinessDetails {
  name: string;
  phone: string | null;
  address: string | null;
}

// 🌟 ADDED: User profile relation matching API extraction nodes
export interface UserDetails {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface OrderData {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryNotes?: string | null;
  deliveryFee: number; // ADD THIS

  createdAt: string;
  user: UserDetails;

  business: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  items: OrderItem[];
}