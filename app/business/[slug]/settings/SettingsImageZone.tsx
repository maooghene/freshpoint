"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Store, UploadCloud } from "lucide-react";
import { resolveImageUrlClient } from "@/lib/resolve-image-url-client";

interface SettingsImageZoneProps {
  initialImage: string | null;
  isPending: boolean;
  error?: string[];
}

export default function SettingsImageZone({
  initialImage,
  isPending,
  error,
}: SettingsImageZoneProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const resolveDisplayImage = (): string | null => {
    if (filePreview) return filePreview;
    return resolveImageUrlClient(initialImage);
  };

  const imageSrc = resolveDisplayImage();

  return (
    <div className="space-y-2">
      <Label
        htmlFor="imageFile"
        className="flex items-center gap-2 text-foreground/90 font-medium"
      >
        <ImageIcon className="h-4 w-4 text-muted-foreground/80" />
        {"Business Profile Image"}
      </Label>

      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/30 transition-colors">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-background border shrink-0 flex items-center justify-center text-muted-foreground/30">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt="Storefront Setup Preview"
              fill
              className="object-cover"
              unoptimized={Boolean(filePreview)}
            />
          ) : (
            <Store className="w-6 h-6 text-muted-foreground/20 animate-pulse" />
          )}
        </div>

        <div className="flex-1 w-full text-center sm:text-left space-y-1 relative">
          <div className="relative inline-block">
            <input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              disabled={isPending}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-20"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="rounded-lg font-bold text-xs h-8 gap-1.5 border-primary/20 text-primary bg-background pointer-events-none"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {"Choose Image File"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
            {"Supports JPEG, PNG, or WebP up to 4MB. No external URLs needed."}
          </p>
          {error && (
            <p className="text-xs font-medium text-destructive animate-pulse mt-1">
              {error[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
