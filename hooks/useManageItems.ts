import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import {
  BaseItem,
  ServiceItem,
  ProductItem,
  EditForm,
  UpdatedItemResponse,
  LocationOverrideRow,
} from "@/components/business/manage-items/types";

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

export function useManageItems(businessSlug: string) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>(true);
  const [resolvedBusinessId, setResolvedBusinessId] = useState<string>("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<
    ServiceItem | ProductItem | null
  >(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);

  // Location pricing state — only meaningful once a business has 2+
  // locations, but always fetched/tracked regardless; the UI decides
  // whether to render based on locationOverrides.length.
  const [locationOverrides, setLocationOverrides] = useState<
    LocationOverrideRow[]
  >([]);
  const [loadingOverrides, setLoadingOverrides] = useState<boolean>(false);
  const [savingOverrides, setSavingOverrides] = useState<boolean>(false);

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

    // Fetch this item's location overrides asynchronously — doesn't block
    // opening the modal, the location pricing section just shows its own
    // loading state until this resolves.
    void loadOverrides(item.id);
  };

  const loadOverrides = async (itemId: string) => {
    if (!resolvedBusinessId) return;
    setLoadingOverrides(true);
    try {
      const token = await getToken();
      const { data } = await axios.get<{ overrides: LocationOverrideRow[] }>(
        `/api/businesses/${resolvedBusinessId}/items/${itemId}/location-overrides`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setLocationOverrides(data.overrides);
    } catch {
      // Non-fatal — the base item is still editable even if overrides fail
      // to load. Leave the list empty; the section will show nothing to
      // edit rather than stale/wrong data.
      setLocationOverrides([]);
    } finally {
      setLoadingOverrides(false);
    }
  };

  const updateOverridePrice = (locationId: string, value: string) => {
    setLocationOverrides((prev) =>
      prev.map((row) =>
        row.locationId === locationId
          ? { ...row, price: value.trim() === "" ? null : Number(value) }
          : row,
      ),
    );
  };

  const updateOverrideAvailability = (
    locationId: string,
    isAvailable: boolean,
  ) => {
    setLocationOverrides((prev) =>
      prev.map((row) =>
        row.locationId === locationId ? { ...row, isAvailable } : row,
      ),
    );
  };

  const handleSaveOverrides = async () => {
    if (!selectedItem || !resolvedBusinessId) return;
    setSavingOverrides(true);
    try {
      const token = await getToken();
      await axios.put(
        `/api/businesses/${resolvedBusinessId}/items/${selectedItem.id}/location-overrides`,
        {
          overrides: locationOverrides.map((row) => ({
            locationId: row.locationId,
            price: row.price,
            isAvailable: row.isAvailable,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Location pricing updated!");
    } catch {
      toast.error("Failed to save location pricing");
    } finally {
      setSavingOverrides(false);
    }
  };

  const closeEdit = () => {
    setSelectedItem(null);
    setForm(EMPTY_FORM);
    setLocationOverrides([]);
  };

  const toggleStatus = async (id: string, type: "SERVICE" | "PRODUCT") => {
    try {
      const token = await getToken();
      const targetId = resolvedBusinessId || "cmr09c70h0000r8igj2u9yh11";

      await axios.post(
        `/api/businesses/${targetId}/item-toggle`,
        { itemId: id, businessSlug },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (type === "SERVICE") {
        setServices((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)),
        );
      } else {
        setProducts((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)),
        );
      }
      toast.success("Visibility updated!");
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async (id: string, type: "SERVICE" | "PRODUCT") => {
    try {
      const token = await getToken();
      const targetId = resolvedBusinessId || "cmr09c70h0000r8igj2u9yh11";

      await axios.delete(
        `/api/businesses/${targetId}/items?id=${id}&slug=${businessSlug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (type === "SERVICE") {
        setServices((p) => p.filter((s) => s.id !== id));
      } else {
        setProducts((p) => p.filter((s) => s.id !== id));
      }
      toast.success("Item deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedItem) return;
    try {
      const token = await getToken();
      const targetId = resolvedBusinessId || "cmr09c70h0000r8igj2u9yh11";
      const fd = new FormData();

      fd.append("id", selectedItem.id);
      fd.append("type", selectedItem.type);
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("price", form.price);
      fd.append("businessSlug", businessSlug);

      if (selectedItem.type === "SERVICE" && form.duration)
        fd.append("duration", form.duration);
      if (selectedItem.type === "PRODUCT") {
        if (form.stock) fd.append("stock", form.stock);
        if (form.sku) fd.append("sku", form.sku.trim());
        if (form.costPrice) fd.append("costPrice", form.costPrice);
        if (form.weight) fd.append("weight", form.weight);
      }

      const { data } = await axios.put<UpdatedItemResponse>(
        `/api/businesses/${targetId}/items`,
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
    } catch {
      toast.error("Update failed");
    }
  };

  useEffect(() => {
    if (!user || !businessSlug) return;
    let mounted = true;

    const loadItems = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        const bizRes = await fetch(`/api/businesses/slug/${businessSlug}`, {
          cache: "no-store",
        });
        if (!bizRes.ok) throw new Error("Could not resolve business");
        const bizData = await bizRes.json();
        if (!bizData?.id) return;

        if (mounted) setResolvedBusinessId(String(bizData.id));

        const { data } = await axios.get<{ items: BaseItem[] }>(
          `/api/businesses/${bizData.id}/items`,
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
      } catch {
        if (mounted) setLoading(false);
      }
    };

    void loadItems();
    return () => {
      mounted = false;
    };
  }, [user, getToken, businessSlug]);

  return {
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
    locationOverrides,
    loadingOverrides,
    savingOverrides,
    updateOverridePrice,
    updateOverrideAvailability,
    handleSaveOverrides,
  };
}
