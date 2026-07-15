import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="p-6 border border-border bg-card text-card-foreground rounded-2xl shadow-sm transition-all hover:shadow-md w-full min-w-0 flex flex-col justify-between h-full group">
      <div className="flex justify-between items-start gap-4 w-full min-w-0">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Maintained brand sub-text properties */}
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground break-words leading-relaxed">
            {title}
          </p>

          {/* 
            🎯 BRAND TYPOGRAPHY SYNC:
            - Removed font-mono to safely restore your global primary font face.
            - Kept tabular-nums to prevent text alignment shifts during real-time database updates.
            - Kept break-words to ensure clean wrapping behavior across all screens.
          */}
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl xl:text-2xl whitespace-nowrap text-foreground tabular-nums leading-none mt-1">
            {value}
          </h2>
        </div>

        {/* Brand layout icon alignment bounds */}
        <div className="p-2.5 rounded-xl bg-muted/40 shrink-0 select-none border border-border/20 transition-colors group-hover:bg-muted">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}
