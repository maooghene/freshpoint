"use client";

import { PaystackButton } from "react-paystack";

// Explicitly type the expected parameters passed down into the transaction context
interface PaystackMetadata {
  itemId?: string;
  dateTime?: string;
  businessId?: string | null;
  userId?: string | null;
  [key: string]: unknown; // Gracefully handles future custom parameters without breaking type contracts
}

// Structurally type the official response contract returned by the Paystack SDK gate
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
    amount: amount * 100, // Paystack captures raw amounts inside local Nigerian Kobo subdivisions
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
      onSuccess(response.reference);
    },
    onClose,
  };

  return (
    <PaystackButton
      {...componentProps}
      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl text-lg transition-colors cursor-pointer shadow-md hover:shadow-lg"
    />
  );
}
