"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createBusiness, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import {
  Store,
  Link2,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";

export function RegisterBusinessForm() {
  const router = useRouter();
  const initialState: RegisterState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState<
    RegisterState,
    FormData
  >(createBusiness, initialState);
  const [slugValue, setSlugValue] = React.useState("");

  // Sync automatic url safe slug suggestion transformations as user types shop name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const generatedStr = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Strip weird characters
      .replace(/\s+/g, "-") // Collapse space intervals to clean hyphens
      .replace(/-+/g, "-"); // Prevent multi-hyphen strings
    setSlugValue(generatedStr);
  };

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success("Merchant storefront registered successfully!");
        // The message body passes back the clean slug token safely to resolve the client route push instantly
        router.push(`/business/${state.message}`);
      } else {
        toast.error(state.message);
      }
    }
  }, [state, router]);

  return (
    <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl animate-in fade-in duration-200">
      <div className="mb-6 pb-4 border-b border-border">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          Setup Your Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Initialize your store parameters on Freshpoint. Let&apos;s map out
          your public client profile metadata.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Business Name Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="name"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <Store className="h-4 w-4 text-muted-foreground" />
            Shop Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Freshpoint Salon & Spa"
            onChange={handleNameChange}
            disabled={isPending}
            required
            className="rounded-xl"
          />
          {state.errors?.name && (
            <p className="text-xs font-semibold text-destructive mt-0.5">
              {state.errors.name}
            </p>
          )}
        </div>

        {/* Clean URL Param Token (Slug) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="slug"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <Link2 className="h-4 w-4 text-muted-foreground" />
            Marketplace URL Parameter (Slug)
          </Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-medium text-muted-foreground select-none pointer-events-none">
              ://freshpoint.com
            </span>
            <Input
              id="slug"
              name="slug"
              type="text"
              value={slugValue}
              onChange={(e) =>
                setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              placeholder="salon-and-spa"
              disabled={isPending}
              required
              className="pl-[148px] rounded-xl font-mono text-xs"
            />
          </div>
          <p className="text-[10px] text-muted-foreground pl-1">
            This identifies your multi-tenant shop URL workspace securely.
            Lowercase alphanumeric and hyphens only.
          </p>
          {state.errors?.slug && (
            <p className="text-xs font-semibold text-destructive mt-0.5">
              {state.errors.slug}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Public Work Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="flex items-center gap-2 text-foreground font-bold"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              Business Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@brand.com"
              disabled={isPending}
              required
              className="rounded-xl"
            />
            {state.errors?.email && (
              <p className="text-xs font-semibold text-destructive mt-0.5">
                {state.errors.email}
              </p>
            )}
          </div>

          {/* Business Phone Number */}
          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="flex items-center gap-2 text-foreground font-bold"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              Store Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              disabled={isPending}
              required
              className="rounded-xl"
            />
            {state.errors?.phone && (
              <p className="text-xs font-semibold text-destructive mt-0.5">
                {state.errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Physical Address Coordinates */}
        <div className="space-y-1.5">
          <Label
            htmlFor="address"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Physical Street Address
          </Label>
          <Input
            id="address"
            name="address"
            type="text"
            placeholder="123 Corporate Way, Suite 100"
            disabled={isPending}
            required
            className="rounded-xl"
          />
          {state.errors?.address && (
            <p className="text-xs font-semibold text-destructive mt-0.5">
              {state.errors.address}
            </p>
          )}
        </div>

        {/* Booking Capacity Validator Parameter */}
        <div className="space-y-1.5 w-full sm:max-w-[50%]">
          <Label
            htmlFor="sittingCapacity"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Global Sitting Capacity
          </Label>
          <Input
            id="sittingCapacity"
            name="sittingCapacity"
            type="number"
            min="1"
            defaultValue="1"
            disabled={isPending}
            required
            className="rounded-xl"
          />
          {state.errors?.sittingCapacity && (
            <p className="text-xs font-semibold text-destructive mt-0.5">
              {state.errors.sittingCapacity}
            </p>
          )}
        </div>

        {/* Business Text Description */}
        <div className="space-y-1.5">
          <Label
            htmlFor="description"
            className="flex items-center gap-2 text-foreground font-bold"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Short Brand Description
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your workspace offerings, specialties, and client workflow details..."
            rows={3}
            disabled={isPending}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Form Submission Control Interface */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-11 shadow-md hover:shadow-lg transition-all rounded-xl mt-2 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending
            ? "Configuring Database Cluster..."
            : "Provision Freshpoint Workspace"}
        </Button>
      </form>
    </div>
  );
}
