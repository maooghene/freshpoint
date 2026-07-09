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
}

/**
 * Extracts and normalizes form primitives into type-safe database schemas.
 */
export async function parseItemFormData(
  formData: FormData,
): Promise<ParsedItemFormData> {
  const id = formData.get("id") as string | null;
  const typeInput = formData.get("type") as string;
  const type = typeInput === "PRODUCT" ? ItemType.PRODUCT : ItemType.SERVICE;

  const name = (formData.get("name") as string) || "";
  const description = (formData.get("description") as string) || "";
  const price = parseFloat((formData.get("price") as string) || "0");
  const imageFile = formData.get("image") as File | null;

  const duration =
    type === ItemType.SERVICE
      ? parseInt((formData.get("duration") as string) || "30", 10)
      : null;

  const stock =
    type === ItemType.PRODUCT
      ? parseInt((formData.get("stock") as string) || "0", 10)
      : null;

  return { id, type, name, description, price, imageFile, duration, stock };
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
