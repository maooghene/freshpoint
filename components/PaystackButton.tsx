"use client";

import * as React from "react";
import { PaystackButton } from "react-paystack";

interface PaystackMetadata {
  itemId?: string;
  dateTime?: string;
  businessId?: string | null;
  userId?: string | null;
  [key: string]: unknown;
}

interface PaystackSuccessResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
}

interface PaystackButtonProps {
  amount: number;
  email: string;
  name?: string;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  metadata?: PaystackMetadata;
}

export default function PaystackBtn({
  amount,
  email,
  name = "Customer",
  onSuccess,
  onClose,
  metadata = {},
}: PaystackButtonProps) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

  // Ask the server whether this customer may pay right now (maintenance mode
  // or the daily booking limit) before showing the Pay button, so nobody is
  // charged for something that would be rejected. The confirm routes check the
  // same rules again as a backstop.
  const kind = metadata.orderType === "PRODUCT" ? "order" : "booking";
  const [blockedMessage, setBlockedMessage] = React.useState<string | null>(
    null,
  );
  React.useEffect(() => {
    let alive = true;
    fetch(`/api/platform/checkout-status?kind=${kind}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { blocked?: boolean; message?: string } | null) => {
        if (alive) setBlockedMessage(data?.blocked ? (data.message ?? "") : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [kind]);

  const componentProps = {
    publicKey,
    email,
    amount: amount * 100,
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: name,
        },
      ],
    },
    text: "Pay Now",
    onSuccess: (response: PaystackSuccessResponse) => {
      console.log("PAYSTACK SDK onSuccess FIRED:", response);
      onSuccess(response.reference);
    },
    onClose: () => {
      console.log("PAYSTACK SDK onClose FIRED");
      onClose?.();
    },
  };

  console.log("PAYSTACK BUTTON PROPS:", {
    publicKey,
    email,
    amount: componentProps.amount,
    metadata: componentProps.metadata,
  });

  if (blockedMessage) {
    return (
      <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm font-semibold text-amber-700 dark:text-amber-400">
        {blockedMessage}
      </div>
    );
  }

  return (
    <PaystackButton
      {...componentProps}
      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl text-lg transition-colors cursor-pointer shadow-md hover:shadow-lg"
    />
  );
}
