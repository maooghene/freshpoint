"use client";

import * as React from "react";
import { useActionState, useRef } from "react";
import { updateBusinessSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import SettingsImageZone from "./SettingsImageZone";
import { IdentityFields } from "./IdentityFields";
import { CapacityCategoryFields } from "./CapacityCategoryFields";
import { DescriptionField } from "./DescriptionField";
import { Save, RotateCcw } from "lucide-react";

interface ActionState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    phone?: string[];
    address?: string[];
    sittingCapacity?: string[];
    categories?: string[];
    description?: string[];
    image?: string[];
  };
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  sittingCapacity: number;
  categories: string[];
  description: string | null;
  image: string | null;
}

interface SettingsFormProps {
  business: BusinessData;
}

export function SettingsForm({ business }: SettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const boundAction = updateBusinessSettings.bind(
    null,
    business.id,
    business.slug,
  );

  const initialState: ActionState = { success: false, message: "" };
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    initialState,
  );

  React.useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  // Clears and resets input values back to original properties
  const handleCancelUndo = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.reset();
      toast.info("Form modifications reverted.");
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          Workspace Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {
            "Modify your store's public profile details displayed to consumers across the marketplace ecosystem."
          }
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-6">
        <CapacityCategoryFields
          business={business}
          isPending={isPending}
          errors={state.errors}
        />

        <SettingsImageZone
          initialImage={business.image}
          isPending={isPending}
          error={state.errors?.image}
        />

        <DescriptionField
          business={business}
          isPending={isPending}
          errors={state.errors}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancelUndo}
            className="flex items-center gap-2 border-border text-foreground font-semibold h-10 rounded-xl px-4 cursor-pointer hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> Cancel Changes
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl px-4 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving Records..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
