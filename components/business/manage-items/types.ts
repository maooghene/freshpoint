export interface BaseItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  type: "SERVICE" | "PRODUCT";
  sku?: string | null;
  costPrice?: number | null;
  weight?: number | null;
}

export interface ServiceItem extends BaseItem {
  type: "SERVICE";
  duration: number;
}

export interface ProductItem extends BaseItem {
  type: "PRODUCT";
  stock: number;
}

export interface EditForm {
  name: string;
  description: string;
  price: string;
  duration: string;
  stock: string;
  sku: string;
  costPrice: string;
  weight: string;
}

export interface UpdatedItemResponse {
  item: BaseItem & (ServiceItem | ProductItem);
}
