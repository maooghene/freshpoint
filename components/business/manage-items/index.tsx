"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import Loading from "@/components/Loading";

import {
  BaseItem,
  ServiceItem,
  ProductItem,
  EditForm,
  UpdatedItemResponse,
} from "./types";
import { ServicesTable } from "./ServicesTable";
import { ProductsTable } from "./ProductsTable";
import { EditItemModal } from "./EditItemModal";

const EMPTY_FORM: EditForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  stock: "",
  sku: "",
  costPrice: "",
  weight: "",
};

// Define the interface to accept the businessSlug from your app routing page
interface BusinessManageItemsProps {
  businessSlug: string;
}

export default function BusinessManageItems({
  businessSlug,
}: BusinessManageItemsProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const currency = "₦";

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<
    ServiceItem | ProductItem | null
  >(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);

  const openEdit = (item: ServiceItem | ProductItem) => {
    setSelectedItem(item);
    setForm({
      name: item.name ?? "",
      description: item.description ?? "",
      price: item.price.toString(),
      duration:
        item.type === "SERVICE"
          ? (item as ServiceItem).duration.toString()
          : "",
      stock:
        item.type === "PRODUCT" ? (item as ProductItem).stock.toString() : "",
      sku: item.sku ?? "",
      costPrice: item.costPrice != null ? item.costPrice.toString() : "",
      weight: item.weight != null ? item.weight.toString() : "",
    });
  };

  const closeEdit = () => {
    setSelectedItem(null);
    setForm(EMPTY_FORM);
  };

  const toggleStatus = async (id: string, type: "SERVICE" | "PRODUCT") => {
    const token = await getToken();
    await axios.post(
      "/api/business/item-toggle",
      { itemId: id, businessSlug }, // Send slug to verify the request owns this item
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (type === "SERVICE") {
      setServices((prev: ServiceItem[]) =>
        prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)),
      );
    } else {
      setProducts((prev: ProductItem[]) =>
        prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)),
      );
    }
  };

  const handleDelete = async (id: string, type: "SERVICE" | "PRODUCT") => {
    const token = await getToken();
    // Pass businessSlug in query params to confirm deletion rights within this tenant workspace
    await axios.delete(`/api/business/items?id=${id}&slug=${businessSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    type === "SERVICE"
      ? setServices((p) => p.filter((s) => s.id !== id))
      : setProducts((p) => p.filter((s) => s.id !== id));
  };

  const handleEditSubmit = async () => {
    if (!selectedItem) return;
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append("id", selectedItem.id);
      fd.append("type", selectedItem.type);
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("price", form.price);
      fd.append("businessSlug", businessSlug); // Include slug in form data submission

      if (selectedItem.type === "SERVICE" && form.duration)
        fd.append("duration", form.duration);
      if (selectedItem.type === "PRODUCT") {
        if (form.stock) fd.append("stock", form.stock);
        if (form.sku) fd.append("sku", form.sku.trim());
        if (form.costPrice) fd.append("costPrice", form.costPrice);
        if (form.weight) fd.append("weight", form.weight);
      }
      const { data } = await axios.put<UpdatedItemResponse>(
        "/api/business/items",
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const updated = data.item;
      if (selectedItem.type === "SERVICE") {
        setServices((p) =>
          p.map((s) =>
            s.id === updated.id
              ? { ...(updated as ServiceItem), type: "SERVICE" }
              : s,
          ),
        );
      } else {
        setProducts((p) =>
          p.map((s) =>
            s.id === updated.id
              ? { ...(updated as ProductItem), type: "PRODUCT" }
              : s,
          ),
        );
      }
      toast.success("Item updated!");
      closeEdit();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to update"
          : "Failed to update",
      );
    }
  };

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const loadItems = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        // Append the active businessSlug to securely fetch only this business's items
        const { data } = await axios.get<{ items: BaseItem[] }>(
          `/api/business/items?slug=${businessSlug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const byNewest = (a: BaseItem, b: BaseItem) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        if (mounted) {
          setServices(
            data.items
              .filter((i): i is ServiceItem => i.type === "SERVICE")
              .sort(byNewest),
          );
          setProducts(
            data.items
              .filter((i): i is ProductItem => i.type === "PRODUCT")
              .sort(byNewest),
          );
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          toast.error(
            axios.isAxiosError(error)
              ? error.response?.data?.message || "Failed to fetch items"
              : "Failed to fetch items",
          );
          setLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      mounted = false;
    };
  }, [user, getToken, businessSlug]); // Added businessSlug to dependency array

  if (loading) return <Loading />;

  return (
    <div className="space-y-12">
      <ServicesTable
        services={services}
        currency={currency}
        onToggle={toggleStatus}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <ProductsTable
        products={products}
        currency={currency}
        onToggle={toggleStatus}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
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
