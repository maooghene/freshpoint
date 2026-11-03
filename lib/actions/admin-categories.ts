// lib/actions/admin-categories.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin";
import { logAdminAction } from "@/lib/actions/admin-audit";
import { CategoryScope } from "@prisma/client";
import { z } from "zod";
import { idSchema, text } from "@/lib/validation";

const labelSchema = text(80, 2);
const valueSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_]{2,40}$/, "Use 2-40 letters, numbers or underscores");
const scopeSchema = z.nativeEnum(CategoryScope);

function invalid(error: z.ZodError) {
  return {
    success: false as const,
    message: error.issues[0]?.message ?? "Invalid input.",
  };
}

// ── Business Categories ──

export async function getBusinessCategories() {
  return prisma.businessCategory.findMany({ orderBy: { label: "asc" } });
}

export async function createBusinessCategoryAction(
  label: string,
  value: string,
) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  const input = z
    .object({ label: labelSchema, value: valueSchema })
    .safeParse({ label, value });
  if (!input.success) return invalid(input.error);

  try {
    const created = await prisma.businessCategory.create({
      data: input.data,
    });
    await logAdminAction({
      action: "CREATE_BUSINESS_CATEGORY",
      targetType: "BusinessCategory",
      targetId: created.id,
      targetLabel: created.label,
    });
    revalidatePath("/admin/categories");
    return { success: true, message: "Business category added." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Database error";
    return { success: false, message: `Failed to add category: ${msg}` };
  }
}

export async function updateBusinessCategoryLabelAction(
  id: string,
  label: string,
) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  const input = z
    .object({ id: idSchema, label: labelSchema })
    .safeParse({ id, label });
  if (!input.success) return invalid(input.error);

  const updated = await prisma.businessCategory.update({
    where: { id: input.data.id },
    data: { label: input.data.label },
  });
  await logAdminAction({
    action: "RENAME_BUSINESS_CATEGORY",
    targetType: "BusinessCategory",
    targetId: id,
    targetLabel: updated.label,
  });
  revalidatePath("/admin/categories");
  return { success: true, message: "Category renamed." };
}

export async function toggleBusinessCategoryAction(
  id: string,
  isActive: boolean,
) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  const input = z
    .object({ id: idSchema, isActive: z.boolean() })
    .safeParse({ id, isActive });
  if (!input.success) return invalid(input.error);

  const updated = await prisma.businessCategory.update({
    where: { id: input.data.id },
    data: { isActive: input.data.isActive },
  });
  await logAdminAction({
    action: "TOGGLE_BUSINESS_CATEGORY",
    targetType: "BusinessCategory",
    targetId: id,
    targetLabel: updated.label,
    metadata: { isActive },
  });
  revalidatePath("/admin/categories");
  return {
    success: true,
    message: `Category ${isActive ? "activated" : "deactivated"}.`,
  };
}

export async function deleteBusinessCategoryAction(id: string) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  if (!idSchema.safeParse(id).success)
    return { success: false, message: "Invalid category." };

  const category = await prisma.businessCategory.findUnique({ where: { id } });
  if (!category) return { success: false, message: "Category not found." };

  // Safe-delete guard: check if any business still references this category's value
  const inUseCount = await prisma.business.count({
    where: { categories: { has: category.value } },
  });

  if (inUseCount > 0) {
    return {
      success: false,
      message: `Cannot delete — ${inUseCount} business${inUseCount === 1 ? "" : "es"} still use "${category.label}". Deactivate it instead, or reassign those businesses first.`,
    };
  }

  await prisma.businessCategory.delete({ where: { id } });
  await logAdminAction({
    action: "DELETE_BUSINESS_CATEGORY",
    targetType: "BusinessCategory",
    targetId: id,
    targetLabel: category.label,
  });
  revalidatePath("/admin/categories");
  return { success: true, message: "Category permanently deleted." };
}

// ── Item Categories ──

export async function getItemCategories() {
  return prisma.itemCategory.findMany({ orderBy: { name: "asc" } });
}

export async function createItemCategoryAction(
  name: string,
  scope: CategoryScope,
) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  const input = z
    .object({ name: labelSchema, scope: scopeSchema })
    .safeParse({ name, scope });
  if (!input.success) return invalid(input.error);

  try {
    const created = await prisma.itemCategory.create({
      data: input.data,
    });
    await logAdminAction({
      action: "CREATE_ITEM_CATEGORY",
      targetType: "ItemCategory",
      targetId: created.id,
      targetLabel: created.name,
    });
    revalidatePath("/admin/categories");
    return { success: true, message: "Item category added." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Database error";
    return { success: false, message: `Failed to add category: ${msg}` };
  }
}

export async function updateItemCategoryAction(
  id: string,
  name: string,
  scope: CategoryScope,
) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  const input = z
    .object({ id: idSchema, name: labelSchema, scope: scopeSchema })
    .safeParse({ id, name, scope });
  if (!input.success) return invalid(input.error);

  const updated = await prisma.itemCategory.update({
    where: { id: input.data.id },
    data: { name: input.data.name, scope: input.data.scope },
  });
  await logAdminAction({
    action: "UPDATE_ITEM_CATEGORY",
    targetType: "ItemCategory",
    targetId: id,
    targetLabel: updated.name,
  });
  revalidatePath("/admin/categories");
  return { success: true, message: "Category updated." };
}

export async function toggleItemCategoryAction(id: string, isActive: boolean) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  const input = z
    .object({ id: idSchema, isActive: z.boolean() })
    .safeParse({ id, isActive });
  if (!input.success) return invalid(input.error);

  const updated = await prisma.itemCategory.update({
    where: { id: input.data.id },
    data: { isActive: input.data.isActive },
  });
  await logAdminAction({
    action: "TOGGLE_ITEM_CATEGORY",
    targetType: "ItemCategory",
    targetId: id,
    targetLabel: updated.name,
    metadata: { isActive },
  });
  revalidatePath("/admin/categories");
  return {
    success: true,
    message: `Category ${isActive ? "activated" : "deactivated"}.`,
  };
}

export async function deleteItemCategoryAction(id: string) {
  const { isAdmin } = await verifyAdminSession();
  if (!isAdmin) return { success: false, message: "Unauthorized." };

  if (!idSchema.safeParse(id).success)
    return { success: false, message: "Invalid category." };

  const category = await prisma.itemCategory.findUnique({ where: { id } });
  if (!category) return { success: false, message: "Category not found." };

  // Safe-delete guard: real FK, so this is a reliable, exact count
  const inUseCount = await prisma.item.count({ where: { categoryId: id } });

  if (inUseCount > 0) {
    return {
      success: false,
      message: `Cannot delete — ${inUseCount} item${inUseCount === 1 ? "" : "s"} still tagged "${category.name}". Deactivate it instead, or reassign those items first.`,
    };
  }

  await prisma.itemCategory.delete({ where: { id } });
  await logAdminAction({
    action: "DELETE_ITEM_CATEGORY",
    targetType: "ItemCategory",
    targetId: id,
    targetLabel: category.name,
  });
  revalidatePath("/admin/categories");
  return { success: true, message: "Category permanently deleted." };
}
