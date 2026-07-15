"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { AddItemHeader } from "./AddItemHeader";
import { ItemTypeToggle } from "./ItemTypeToggle";
import { ItemCoreFieldsGrid } from "./ItemCoreFieldsGrid";

export type ItemType = "SERVICE" | "PRODUCT";

export interface ItemFormState {
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
  stock: string;
}

interface AddItemDashboardProps {
  businessSlug: string;
}

const emptyFormFor = (type: ItemType): ItemFormState => ({
  name: "",
  description: "",
  price: "",
  duration: type === "SERVICE" ? "30" : "0",
  category: "",
  stock: type === "PRODUCT" ? "1" : "0",
});

export default function FreshpointAddItemDashboard({
  businessSlug,
}: AddItemDashboardProps) {
  const [type, setType] = useState<ItemType>("SERVICE");
  const [prevType, setPrevType] = useState<ItemType>("SERVICE");
  const [serviceInfo, setServiceInfo] = useState<ItemFormState>(
    emptyFormFor("SERVICE"),
  );
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { getToken } = useAuth();

  // ✅ Reset form fields during render when `type` changes, instead of in a
  // useEffect — avoids the extra cascading render React was warning about.
  if (type !== prevType) {
    setPrevType(type);
    setServiceInfo(emptyFormFor(type));
    setImage(null);
    setImagePreview(null);
  }

  const onChangeHandler = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void => {
    setServiceInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "PRODUCT" && !image) {
      toast.error("Please upload an image for the product");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", serviceInfo.name.trim());
      formData.append("description", serviceInfo.description.trim());
      formData.append("price", serviceInfo.price);
      formData.append("category", serviceInfo.category);
      formData.append("businessSlug", businessSlug);

      if (type === "SERVICE") formData.append("duration", serviceInfo.duration);
      if (type === "PRODUCT") formData.append("stock", serviceInfo.stock);
      if (image) formData.append("image", image);

      const token = await getToken();

      await axios.post(`/api/businesses/${businessSlug}/items`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      setServiceInfo(emptyFormFor(type));
      setImage(null);
      setImagePreview(null);

      const displayLabel = type === "SERVICE" ? "Service" : "Product";
      toast.success(`${displayLabel} added successfully!`);
    } catch (error: unknown) {
      console.error("FreshPointSubmit Error Logger:", error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          "Failed to create item due to structural route restrictions.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="mb-28 max-w-2xl space-y-6 mx-auto"
    >
      <AddItemHeader type={type} />

      <ItemTypeToggle type={type} setType={setType} loading={loading} />

      <ItemCoreFieldsGrid
        type={type}
        loading={loading}
        serviceInfo={serviceInfo}
        imagePreview={imagePreview}
        onChangeHandler={onChangeHandler}
        handleImageChange={handleImageChange}
        setImage={setImage}
        setImagePreview={setImagePreview}
      />
    </form>
  );
}
