"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createBusiness, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Sparkles, Loader2, RefreshCw, XCircle } from "lucide-react";

import { BasicInfoFields } from "./BasicInfoFields";
import { ImageAndCategoryFields } from "./ImageAndCategoryFields";
import { FormContactFields } from "@/components/checkout/FormContactFields";
import { FormLocationCapacityFields } from "@/components/checkout/FormLocationCapacityFields";
import { FormDescriptionField } from "@/components/checkout/FormDescriptionField";

const initialState: RegisterState = { success: false, message: "" };

export function RegisterBusinessForm(): React.JSX.Element {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createBusiness,
    initialState,
  );
  const [slugValue, setSlugValue] = React.useState<string>("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const generatedStr = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setSlugValue(generatedStr);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleSubmitIntercept = (e: React.FormEvent<HTMLFormElement>): void => {
    const formData = new FormData(e.currentTarget);
    const imageFile = formData.get("image") as File | null;

    if (!imageFile || imageFile.size === 0) {
      e.preventDefault();
      toast.warning(
        "Image field is required! Please upload an image of your business to get started.",
      );
    }
  };

  React.useEffect(() => {
    if (state.message && !state.isRejectedByFilter) {
      if (state.success && state.finalizedSlug) {
        toast.success("Workspace launched and approved automatically!");
        router.push(`/business/${state.finalizedSlug}`);
      } else if (state.success) {
        // Defensive fallback: success but no slug returned — avoid building a broken URL
        toast.success("Workspace launched! Redirecting to your dashboard...");
        router.push("/workspace-selector");
      } else {
        toast.error(state.message);
      }
    }
  }, [state, router]);

  if (!state.success && state.isRejectedByFilter) {
    return (
      <div className="w-full max-w-xl bg-card border border-destructive/30 rounded-2xl p-8 text-center shadow-xl animate-in shake duration-300">
        <div className="flex justify-center mb-5">
          <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full border border-destructive/20">
            <XCircle className="h-9 w-9 text-destructive" />
          </div>
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tight">
          {"Workspace Creation Blocked"}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed bg-destructive/5 p-4 rounded-xl border border-destructive/10 text-left whitespace-normal break-words">
          {state.message}
        </p>
        <p className="text-xs text-muted-foreground mt-4 leading-normal whitespace-normal break-words">
          {
            "If you believe this automated validation filter was triggered by error, please change your shop name or text description details and try submitting again."
          }
        </p>
        <div className="mt-6 pt-5 border-b border-border" />
        <Button
          onClick={() => window.location.reload()}
          className="w-full mt-4 font-bold bg-secondary hover:bg-secondary/80 text-foreground h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-border"
        >
          <RefreshCw className="h-4 w-4" />
          {"Retry Registration"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl animate-in fade-in duration-200">
      <div className="mb-6 pb-4 border-b border-border">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          {"Setup Your Workspace"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {
            "Initialize your store parameters on Freshpoint. Let's map out your public client profile metadata."
          }
        </p>
      </div>

      <form
        action={formAction}
        onSubmit={handleSubmitIntercept}
        className="space-y-5"
      >
        <BasicInfoFields
          isPending={isPending}
          state={state}
          slugValue={slugValue}
          onNameChange={handleNameChange}
          onSlugChange={handleSlugChange}
        />

        <ImageAndCategoryFields isPending={isPending} state={state} />

        <FormContactFields isPending={isPending} state={state} />
        <FormLocationCapacityFields isPending={isPending} state={state} />
        <FormDescriptionField isPending={isPending} />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-11 shadow-md hover:shadow-lg transition-all rounded-xl mt-2 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Setting up your digital shop..." : "Launch Workspace"}
        </Button>
      </form>
    </div>
  );
}
