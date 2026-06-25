// src/components/business/add-item/ImageUpload.tsx
"use client";

import Image from "next/image";
import { XIcon, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  type: "SERVICE" | "PRODUCT";
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export default function ImageUpload({ type, imagePreview, onImageChange, onClearImage }: ImageUploadProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Item Image {type === "SERVICE" ? "(Optional)" : "(Required)"}
      </label>
      <div className="relative group">
        {imagePreview ? (
          <div className="relative h-48 w-full rounded-2xl overflow-hidden border-2 border-primary/20">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              onClick={onClearImage}
              type="button"
              className="absolute top-2 right-2 bg-destructive p-1 rounded-full text-white hover:scale-110 transition-transform z-10"
            >
              <XIcon size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-primary/20 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors">
            <ImageIcon className="size-10 text-primary/40 mb-2" />
            <span className="text-sm text-muted-foreground">
              Click to upload photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageChange}
            />
          </label>
        )}
      </div>
    </div>
  );
}
