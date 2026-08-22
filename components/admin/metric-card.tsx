// components/admin/metric-card.tsx
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  descriptionClassName?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  descriptionClassName = "text-muted-foreground",
}: MetricCardProps) {
  return (
    <Card className="border border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        <p className={`text-xs mt-1 ${descriptionClassName}`}>{description}</p>
      </CardContent>
    </Card>
  );
}
