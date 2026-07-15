// components/checkout/PaymentSection.tsx
"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

// Maintain your custom lazy configuration block identically
const PaystackBtn = dynamic(() => import("@/components/PaystackButton"), {
  ssr: false,
  loading: () => (
    <Button
      disabled
      className="w-full py-6 rounded-xl font-bold text-base flex items-center justify-center gap-2"
    >
      <Loader2 className="animate-spin h-5 w-5" />
      Loading Payment...
    </Button>
  ),
});

interface PaymentSectionProps {
  paying: boolean;
  price: number;
  email: string;
  name: string;
  metadata: {
    itemId: string;
    dateTime: string | null;
    businessId: string | null;
    userId: string | null;
  };
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function PaymentSection({
  paying,
  price,
  email,
  name,
  metadata,
  onSuccess,
  onClose,
}: PaymentSectionProps) {
  return (
    <div className="relative">
      {paying ? (
        <Button
          disabled
          className="w-full py-6 rounded-xl font-bold text-base flex items-center justify-center gap-2"
        >
          <Loader2 className="animate-spin h-5 w-5" />
          Securing Reservation...
        </Button>
      ) : (
        <PaystackBtn
          amount={price}
          email={email}
          name={name}
          metadata={{
            ...metadata,
            dateTime: metadata.dateTime ?? undefined,
            businessId: metadata.businessId ?? undefined,
            userId: metadata.userId ?? undefined,
          }}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )}
    </div>
  );
}
