// components/checkout/TotalAmountCard.tsx
"use client";

interface TotalAmountCardProps {
  price: number;
}

export function TotalAmountCard({ price }: TotalAmountCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-xs">
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
          Total Amount
        </span>
        <span className="font-black text-2xl text-foreground tracking-tight">
          ₦{Number(price).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
