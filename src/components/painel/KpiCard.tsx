import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AjudaContextual } from "./AjudaContextual";

export type KpiTone = "primary" | "success" | "warning" | "destructive" | "muted";

const toneMap: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

const deltaToneMap: Record<"up" | "down" | "flat", string> = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

interface KpiCardProps {
  title: string;
  /** Pergunta humana exibida em destaque (ex: "Vai bater meta hoje?") */
  pergunta?: string;
  value: string | number;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  /** Storytelling logo abaixo do valor */
  narrativa?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  helpKey?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  pergunta,
  value,
  delta,
  deltaDirection = "flat",
  narrativa,
  hint,
  icon: Icon,
  tone = "primary",
  helpKey,
  onClick,
}: KpiCardProps) {
  const ArrowIcon = deltaDirection === "up" ? TrendingUp : deltaDirection === "down" ? TrendingDown : Minus;
  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all rounded-2xl",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {pergunta ? (
              <p className="text-sm font-semibold text-foreground leading-tight">{pergunta}</p>
            ) : (
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {helpKey && <AjudaContextual helpKey={helpKey} />}
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", toneMap[tone])}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground leading-none">{value}</div>
        {delta && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold", deltaToneMap[deltaDirection])}>
            <ArrowIcon className="w-4 h-4" /> {delta}
          </div>
        )}
        {narrativa && <div className="text-xs text-muted-foreground leading-snug">{narrativa}</div>}
        {hint && !narrativa && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
