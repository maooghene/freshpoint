// components/checkout/settings/TotalCard.tsx
interface TotalCardProps {
  price: number;
}

export function TotalCard({ price }: TotalCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-xs text-card-foreground">
      <div className="flex justify-between items-center">
      </div>
    </div>
  );
}
