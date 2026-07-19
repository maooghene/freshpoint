"use client";

import * as React from "react";
import { toast } from "react-toastify";
import { CategoryScope } from "@prisma/client";
import {
  BusinessCategorySection,
  BusinessCategoryRow,
} from "./BusinessCategorySection";
import { ItemCategorySection, ItemCategoryRow } from "./ItemCategorySection";
import {
  createBusinessCategoryAction,
  toggleBusinessCategoryAction,
  deleteBusinessCategoryAction,
  createItemCategoryAction,
  toggleItemCategoryAction,
  deleteItemCategoryAction,
} from "@/lib/actions/admin-categories";

interface CategoriesManagerProps {
  initialBusinessCategories: BusinessCategoryRow[];
  initialItemCategories: ItemCategoryRow[];
}

export function CategoriesManager({
  initialBusinessCategories,
  initialItemCategories,
}: CategoriesManagerProps) {
  const [businessCategories, setBusinessCategories] = React.useState(
    initialBusinessCategories,
  );
  const [itemCategories, setItemCategories] = React.useState(
    initialItemCategories,
  );

  const [newBusinessLabel, setNewBusinessLabel] = React.useState("");
  const [newBusinessValue, setNewBusinessValue] = React.useState("");
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemScope, setNewItemScope] = React.useState<CategoryScope>("BOTH");

  const [busy, setBusy] = React.useState(false);

  // ── Business Category handlers ──

  const handleAddBusinessCategory = async () => {
    if (!newBusinessLabel.trim() || !newBusinessValue.trim()) {
      toast.error("Label and value are both required.");
      return;
    }
    setBusy(true);
    const res = await createBusinessCategoryAction(
      newBusinessLabel,
      newBusinessValue,
    );
    if (res.success) {
      toast.success(res.message);
      setBusinessCategories((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          label: newBusinessLabel.trim(),
          value: newBusinessValue.trim().toUpperCase(),
          isActive: true,
        },
      ]);
      setNewBusinessLabel("");
      setNewBusinessValue("");
    } else {
      toast.error(res.message);
    }
    setBusy(false);
  };

  const handleToggleBusinessCategory = async (
    id: string,
    isActive: boolean,
  ) => {
    const res = await toggleBusinessCategoryAction(id, isActive);
    if (res.success) {
      toast.success(res.message);
      setBusinessCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive } : c)),
      );
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteBusinessCategory = async (id: string) => {
    const res = await deleteBusinessCategoryAction(id);
    if (res.success) {
      toast.success(res.message);
      setBusinessCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      toast.error(res.message);
    }
  };

  // ── Item Category handlers ──

  const handleAddItemCategory = async () => {
    if (!newItemName.trim()) {
      toast.error("Name is required.");
      return;
    }
    setBusy(true);
    const res = await createItemCategoryAction(newItemName, newItemScope);
    if (res.success) {
      toast.success(res.message);
      setItemCategories((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: newItemName.trim(),
          scope: newItemScope,
          isActive: true,
        },
      ]);
      setNewItemName("");
      setNewItemScope("BOTH");
    } else {
      toast.error(res.message);
    }
    setBusy(false);
  };

  const handleToggleItemCategory = async (id: string, isActive: boolean) => {
    const res = await toggleItemCategoryAction(id, isActive);
    if (res.success) {
      toast.success(res.message);
      setItemCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive } : c)),
      );
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteItemCategory = async (id: string) => {
    const res = await deleteItemCategoryAction(id);
    if (res.success) {
      toast.success(res.message);
      setItemCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-10">
      <BusinessCategorySection
        categories={businessCategories}
        newLabel={newBusinessLabel}
        newValue={newBusinessValue}
        setNewLabel={setNewBusinessLabel}
        setNewValue={setNewBusinessValue}
        onAdd={handleAddBusinessCategory}
        onToggle={handleToggleBusinessCategory}
        onDelete={handleDeleteBusinessCategory}
        busy={busy}
      />

      <ItemCategorySection
        categories={itemCategories}
        newName={newItemName}
        newScope={newItemScope}
        setNewName={setNewItemName}
        setNewScope={setNewItemScope}
        onAdd={handleAddItemCategory}
        onToggle={handleToggleItemCategory}
        onDelete={handleDeleteItemCategory}
        busy={busy}
      />
    </div>
  );
}
