// src/components/business/add-item/index.tsx
"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { SparklesIcon, PackageIcon, ClockIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { ItemType, ItemFormState, CATEGORIES } from "./types";
import ImageUpload from "./ImageUpload";

interface FreshpointAddItemDashboardProps {
  businessSlug: string;
}

export default function FreshpointAddItemDashboard({
  businessSlug,
}: FreshpointAddItemDashboardProps) {
  const [type, setType] = useState<ItemType>("SERVICE");
  const [serviceInfo, setServiceInfo] = useState<ItemFormState>({
    name: "",
    description: "",
    price: "",
    duration: "30",
    category: "",
    stock: "0",
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const onChangeHandler = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setServiceInfo({ ...serviceInfo, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      formData.append("name", serviceInfo.name);
      formData.append("description", serviceInfo.description);
      formData.append("price", serviceInfo.price);
      formData.append("category", serviceInfo.category);
      formData.append("businessSlug", businessSlug); // Secure Multi-tenancy Isolation Key

      if (type === "SERVICE") formData.append("duration", serviceInfo.duration);
      if (type === "PRODUCT") formData.append("stock", serviceInfo.stock);
      if (image) formData.append("image", image);

      const token = await getToken();

      await axios.post("/api/businesses/items", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setServiceInfo({
        name: "",
        description: "",
        price: "",
        duration: "30",
        category: "",
        stock: "0",
      });
      setImage(null);
      setImagePreview(null);

      toast.success(
        `${type === "SERVICE" ? "Service" : "Product"} added successfully!`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="mb-28 max-w-2xl space-y-6 mx-auto"
    >
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Add New{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {type === "SERVICE" ? "Service" : "Product"}
          </span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          {type === "SERVICE"
            ? "Define an offering for booking."
            : "List a physical item for retail sale."}
        </p>
      </div>

      {/* Type Toggle Switches */}
      <div className="flex p-1 bg-secondary/50 rounded-2xl mb-6 w-fit border border-primary/5">
        <button
          type="button"
          onClick={() => setType("SERVICE")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            type === "SERVICE"
              ? "bg-background shadow-md text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <SparklesIcon size={16} /> Service
        </button>
        <button
          type="button"
          onClick={() => setType("PRODUCT")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            type === "PRODUCT"
              ? "bg-background shadow-md text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PackageIcon size={16} /> Product
        </button>
      </div>

      <div className="grid gap-6 bg-background/40 backdrop-blur-md border border-primary/10 p-8 rounded-[2rem] shadow-xl">
        {/* Render Isolated Image Upload Sub-Component */}
        <ImageUpload
          type={type}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onClearImage={() => {
            setImage(null);
            setImagePreview(null);
          }}
        />

        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Name
          </label>
          <Input
            name="name"
            onChange={onChangeHandler}
            value={serviceInfo.name}
            placeholder={
              type === "SERVICE"
                ? "e.g. Deep Tissue Massage"
                : "e.g. Organic Essential Oils"
            }
            className="bg-background/50 border-primary/10 h-12 rounded-xl"
            required
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <Textarea
            name="description"
            onChange={onChangeHandler}
            value={serviceInfo.description}
            placeholder="Details about the item..."
            rows={3}
            className="bg-background/50 border-primary/10 rounded-xl resize-none"
            required
          />
        </div>

        {/* Price & Context Fields Grid */}
        <div
          className={`grid ${type === "SERVICE" ? "grid-cols-2" : "grid-cols-1"} gap-6`}
        >
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Price (₦)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                ₦
              </span>
              <Input
                type="number"
                name="price"
                onChange={onChangeHandler}
                value={serviceInfo.price}
                className="pl-10 bg-background/50 border-primary/10 h-12 rounded-xl"
                required
              />
            </div>
          </div>

          {type === "SERVICE" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Duration (Mins)
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary size-4" />
                <Input
                  type="number"
                  name="duration"
                  onChange={onChangeHandler}
                  value={serviceInfo.duration}
                  className="pl-10 bg-background/50 border-primary/10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>
          )}

          {type === "PRODUCT" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Stock
              </label>
              <Input
                type="number"
                name="stock"
                onChange={onChangeHandler}
                value={serviceInfo.stock}
                placeholder="Quantity available"
                className="bg-background/50 border-primary/10 h-12 rounded-xl"
                required
              />
            </div>
          )}
        </div>

        {/* Category Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Category
          </label>
          <select
            name="category"
            onChange={onChangeHandler}
            value={serviceInfo.category}
            className="flex h-12 w-full rounded-xl border border-primary/10 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none appearance-none"
            required
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
                className="bg-background text-foreground"
              >
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-12 h-14 mt-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
      >
        {type === "SERVICE" ? (
          <SparklesIcon className="mr-2 size-5" />
        ) : (
          <PackageIcon className="mr-2 size-5" />
        )}
        Publish {type === "SERVICE" ? "Service" : "Product"}
      </Button>
    </form>
  );
}
