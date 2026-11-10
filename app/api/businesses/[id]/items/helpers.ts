import { ItemType } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface ParsedItemFormData {
  id: string | null;
  type: ItemType;
  name: string;
  description: string;
  price: number;
  imageFile: File | null;
  duration: number | null;
  stock: number | null;
  categoryId: string | null;
  /** undefined = not sent (leave as is); null = sent empty (clear); NaN = invalid. */
  sku: string | null | undefined;
  costPrice: number | null | undefined;
  weight: number | null | undefined;
}

/**
 * Extracts and normalizes form primitives into type-safe database schemas.
 */
/** Parses an integer form value, falling back to a default and clamping to a range. */
function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = parseInt(raw || String(fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** Optional non-negative number: undefined when not sent, null when blank, NaN when invalid. */
function optionalNumber(
  formData: FormData,
  key: string,
  max: number,
): number | null | undefined {
  if (!formData.has(key)) return undefined;
  const raw = ((formData.get(key) as string | null) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : NaN;
}

export async function parseItemFormData(
  formData: FormData,
): Promise<ParsedItemFormData> {
  const id = formData.get("id") as string | null;
  const typeInput = formData.get("type") as string;
  const type = typeInput === "PRODUCT" ? ItemType.PRODUCT : ItemType.SERVICE;

  const name = ((formData.get("name") as string) || "").trim().slice(0, 120);
  const description = ((formData.get("description") as string) || "")
    .trim()
    .slice(0, 2000);
  const parsedPrice = parseFloat((formData.get("price") as string) || "0");
  // A non-finite, negative or absurd price becomes NaN, which callers reject.
  const price =
    Number.isFinite(parsedPrice) && parsedPrice >= 0 && parsedPrice <= 100_000_000
      ? parsedPrice
      : NaN;
  const imageFile = formData.get("image") as File | null;

  const duration =
    type === ItemType.SERVICE
      ? clampInt(formData.get("duration") as string | null, 30, 1, 1440)
      : null;

  const stock =
    type === ItemType.PRODUCT
      ? clampInt(formData.get("stock") as string | null, 0, 0, 1_000_000)
      : null;

  const categoryIdRaw = formData.get("categoryId") as string | null;
  const categoryId =
    categoryIdRaw && categoryIdRaw.trim() !== "" ? categoryIdRaw : null;

  return {
    id,
    type,
    name,
    description,
    price,
    imageFile,
    duration,
    stock,
    categoryId,
    sku: formData.has("sku")
      ? ((formData.get("sku") as string) || "").trim().slice(0, 64) || null
      : undefined,
    costPrice: optionalNumber(formData, "costPrice", 100_000_000),
    weight: optionalNumber(formData, "weight", 100_000),
  };
}

/**
 * Validates that an item exists and belongs to the specified business branch.
 */
export async function verifyItemTenantOwnership(
  id: string,
  businessId: string,
) {
  return await prisma.item.findFirst({
    where: { id, businessId },
  });
}
