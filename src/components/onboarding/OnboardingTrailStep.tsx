import { Link } from "react-router-dom";
import { Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { OnboardingModule } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

export function OnboardingTrailStep({ index, module: m, isLast }: { index: number; module: OnboardingModule; isLast: boolean }) {
  const locked = m.status === "locked";
  const done = m.status === "completed";
  const Icon = done ? CheckCircle2 : locked ? Lock : PlayCircle;
  const colorBg = done ? "bg-success" : locked ? "bg-muted" : "bg-primary";
  const minutes = Math.max(1, Math.round(m.duration_seconds / 60));

  const Inner = (
    <div className={cn("flex gap-4 items-start p-4 rounded-xl border transition-all", locked ? "border-border bg-muted/30 opacity-60" : "border-border bg-card hover:shadow-md")}>
      <div className={cn("h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-white shadow", colorBg)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground">Etapa {index + 1}</p>
        <h3 className="text-base font-bold text-foreground leading-tight">{m.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{minutes} min · {done ? "Concluída" : locked ? "Bloqueada" : "Disponível"}</p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {locked ? Inner : <Link to={`/treinamento/${m.id}`}>{Inner}</Link>}
      {!isLast && <div className="ml-10 h-4 w-px bg-border" />}
    </div>
  );
}
