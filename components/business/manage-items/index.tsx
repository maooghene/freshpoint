"use client";

import * as React from "react";
import Loading from "@/components/Loading";
import { useManageItems } from "@/hooks/useManageItems";
import { ServicesTable } from "./ServicesTable";
import { ProductsTable } from "./ProductsTable";
import { EditItemModal } from "./EditItemModal";

interface BusinessManageItemsProps {
  businessSlug: string;
}

export default function BusinessManageItems({
  businessSlug,
}: BusinessManageItemsProps) {
  const currency = "₦";

  // 💡 Pull all structural metrics, hook listeners, and data rows from our state engine
  const {
    loading,
    services,
    products,
    selectedItem,
    form,
    setForm,
    openEdit,
    closeEdit,
    toggleStatus,
    handleDelete,
    handleEditSubmit,
  } = useManageItems(businessSlug);

  if (loading) return <Loading />;

  return (
    <div className="space-y-12 animate-in fade-in duration-200">
      {/* SERVICES MANAGEMENT SECTION */}
      <ServicesTable
        services={services}
        currency={currency}
        onToggle={toggleStatus}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* PRODUCTS & STOCK MANAGEMENT SECTION */}
      <ProductsTable
        products={products}
        currency={currency}
        onToggle={toggleStatus}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* EDIT MODAL PORTAL */}
      {selectedItem && (
        <EditItemModal
          item={selectedItem}
          form={form}
          onChange={setForm}
          onSubmit={handleEditSubmit}
          onClose={closeEdit}
        />
      )}
    </div>
  );
}
