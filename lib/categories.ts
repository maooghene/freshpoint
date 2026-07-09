// lib/categories.ts
export const BUSINESS_CATEGORIES = [
  { label: "Salons", value: "SALON" },
  { label: "Spas", value: "SPA" },
  { label: "Aesthetics", value: "CLINIC" },
  { label: "Wellness & Health", value: "WELLNESS" },
  { label: "Other", value: "OTHER" }, // ✅ new
] as const;

export type BusinessCategoryValue =
  (typeof BUSINESS_CATEGORIES)[number]["value"];

export const VALID_CATEGORY_VALUES: string[] = BUSINESS_CATEGORIES.map(
  (c) => c.value,
);
