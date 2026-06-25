// src/components/business/dashboard/StatCard.tsx
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="p-6 border border-border bg-card text-card-foreground rounded-2xl shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">{value}</h2>
        </div>
        <div className={`p-2 rounded-xl bg-muted/40`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}
