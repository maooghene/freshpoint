"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormSubmitButtonProps {
  isPending: boolean;
}

export function FormSubmitButton({ isPending }: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-11 shadow-md hover:shadow-lg transition-all rounded-xl mt-2 flex items-center justify-center gap-2 cursor-pointer"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {isPending
        ? "Setting up your digital shop......"
        : "Provision Freshpoint Workspace"}
    </Button>
  );
}
