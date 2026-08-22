import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PaystackBtnWithNoSSR = dynamic(
  () =>
    import("@/components/PaystackButton").then(
      (mod) => mod.default || mod,
    ),
  { ssr: false },
);

interface PaymentActionProps {
  paying: boolean;
  price: number;
  email: string;
  name: string;
  metadata: {
    itemId: string;
    dateTime: string | undefined;
    businessId: string | undefined;
    userId: string | undefined;
  };
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function PaymentAction({
  paying,
  price,
  email,
  name,
  metadata,
  onSuccess,
  onClose,
}: PaymentActionProps) {
  return (
    <div className="relative">
      {paying ? (
        <Button
          disabled
          className="w-full py-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-primary/80 text-primary-foreground"
        >
          <Loader2 className="animate-spin h-5 w-5" />
          Securing Reservation...
        </Button>
      ) : (
        <PaystackBtnWithNoSSR
          amount={Number(price)}
          email={email}
          name={name}
          metadata={metadata}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )}
    </div>
  );
}
