"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { AddItemHeader } from "./AddItemHeader";
import { ItemTypeToggle } from "./ItemTypeToggle"; // 🚀 RESTORED
import { ItemCoreFieldsGrid } from "./ItemCoreFieldsGrid";
import { compressImage } from "@/lib/compress-image";
import { uploadToImageKit } from "@/lib/upload-to-imagekit";


export type ItemType = "SERVICE" | "PRODUCT";

export interface ItemFormState {
  name: string;
  description: string;
  price: string;
  duration: string;
  categoryId: string;
  stock: string;
  hasVariants: boolean;
}

export interface VariantState {
  id?: string;
  size: string | null;
  color: string | null;
  stock: number;
  price?: number | null;
}

interface AddItemDashboardProps {
  businessSlug: string;
}

const emptyFormFor = (type: ItemType): ItemFormState => ({
  name: "",
  description: "",
  price: "",
  duration: "30",
  categoryId: "",
  stock: "1",
  hasVariants: false,
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
  const [variants, setVariants] = useState<VariantState[]>([]);

  const { getToken } = useAuth();

  // Reset form allocations when user manually swaps type tracks
  if (type !== prevType) {
    setPrevType(type);
    setServiceInfo(emptyFormFor(type));
    setImage(null);
    setImagePreview(null);
    setVariants([]);
  }

 const onChangeHandler = (
   e: React.ChangeEvent<
     HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
   >,
 ): void => {
   const target = e.target as HTMLInputElement; // Safely asserts for fieldType and checked checks
   const { name, value, type: fieldType } = target;

   const isCheckbox = fieldType === "checkbox";
   const nextValue = isCheckbox ? target.checked : value;

   setServiceInfo((prev) => ({ ...prev, [name]: nextValue }));
 };


const handleImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
): Promise<void> => {
  const file = e.target.files?.[0];
  if (!file) return;

  const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);

  try {
    const compressed = await compressImage(file);
    const compressedSizeMB = (compressed.size / 1024 / 1024).toFixed(2);

    console.log(
      `📉 Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`,
    );

    if (compressed.size > 4.5 * 1024 * 1024) {
      toast.warning(
        "Image is still large after compression. Upload may be slow.",
      );
    }

    setImage(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  } catch (err) {
    console.error("Image compression failed, using original file:", err);
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
     let imageUrl: string | null = null;

     if (image) {
       imageUrl = await uploadToImageKit(image);
     }

     const formData = new FormData();
     formData.append("type", type);
     formData.append("name", serviceInfo.name.trim());
     formData.append("description", serviceInfo.description.trim());
     formData.append("price", serviceInfo.price);
     formData.append("categoryId", serviceInfo.categoryId);
     formData.append("businessSlug", businessSlug);

     if (type === "SERVICE") formData.append("duration", serviceInfo.duration);

     if (type === "PRODUCT") {
       const directStock =
         variants.length > 0
           ? variants.reduce((sum, v) => sum + v.stock, 0)
           : parseInt(serviceInfo.stock || "0", 10);

       formData.append("stock", directStock.toString());
       formData.append("variants", JSON.stringify(variants));
     }

     if (imageUrl) formData.append("imageUrl", imageUrl);

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
     setVariants([]);
     setType("SERVICE");

     const displayLabel = type === "SERVICE" ? "Service" : "Product";
     toast.success(`${displayLabel} added successfully!`);
   } catch (error: unknown) {
     console.error("FreshPointSubmit Error Logger:", error);
     if (axios.isAxiosError(error) && error.response?.data?.message) {
       toast.error(error.response.data.message);
     } else if (error instanceof Error) {
       toast.error(error.message);
     } else {
       toast.error("Failed to create item.");
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

      {/* 🚀 RESTORED: Merchant explicitly chooses their track manually here first */}
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
        variants={variants}
        setVariants={setVariants}
      />
    </form>
  );
}
