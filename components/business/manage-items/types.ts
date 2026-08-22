// components/business/manage-items/types.ts

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

// 🚀 FASHION STRUCTURAL CONTRACT ADDITION
export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number | null;
}

export interface ProductItem extends BaseItem {
  type: "PRODUCT";
  stock: number;
  // 🚀 OPTIONAL RELATION MAPPING: Securely enables apparel tracking without mutating baseline features
  variants?: ProductVariant[];
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
  // 🚀 FORM FIELD EXTRACTION HOOK: Carries choice updates safely during editing
  variants?: ProductVariant[];
}

export interface UpdatedItemResponse {
  item: BaseItem & (ServiceItem | ProductItem);
}

// Per-location price/availability override for the currently-open item.
// One row per Location the business has — even locations with no actual
// override row in the DB show up here (price: null, isAvailable: true),
// merged server-side by the location-overrides GET endpoint.
export interface LocationOverrideRow {
  locationId: string;
  locationName: string;
  isPrimary: boolean;
  price: number | null;
  isAvailable: boolean;
}
