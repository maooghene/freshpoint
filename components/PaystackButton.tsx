"use client";

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

  return (
    <PaystackButton
      {...componentProps}
      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl text-lg transition-colors cursor-pointer shadow-md hover:shadow-lg"
    />
  );
}
