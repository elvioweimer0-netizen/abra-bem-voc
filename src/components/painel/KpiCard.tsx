import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "primary" | "success" | "warning" | "destructive" | "muted";

const toneMap: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  onClick?: () => void;
}

export function KpiCard({ title, value, delta, hint, icon: Icon, tone = "primary", onClick }: KpiCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn("transition-all", onClick && "cursor-pointer hover:-translate-y-0.5 hover:card-shadow-md")}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", toneMap[tone])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
        {delta && <div className="text-xs font-medium text-muted-foreground">{delta}</div>}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
