// src/components/business/add-item/types.ts

export type ItemType = "SERVICE" | "PRODUCT";

export interface ItemFormState {
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
  stock: string;
}

export const CATEGORIES = [
  "Therapy & Massage",
  "Skincare & Facials",
  "Fitness & Training",
  "Hair & Grooming",
  "Nails & Aesthetics",
  "Holistic Wellness",
  "Consultations",
  "Bundles & Packages",
  "Wellness Products",
  "Others",
];
