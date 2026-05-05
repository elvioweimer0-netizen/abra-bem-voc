import { useCurioMessage } from "@/hooks/useCurioMessage";
import { useHourContext } from "@/hooks/useHourContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";

export function CurioFalante({ context, className }: { context?: string; className?: string }) {
  const ctxHour = useHourContext();
  const { cargo } = useRole();
  const ctx = context || `saudacao_${ctxHour}`;
  const msg = useCurioMessage(ctx, cargo);
  if (!msg) return null;
  return (
    <Card className={`border-primary/20 bg-primary/5 ${className ?? ""}`}>
      <CardContent className="p-3 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-2xl shrink-0" aria-hidden>
          🦜
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Curiozinho diz:</p>
          <p className="text-sm text-foreground font-medium leading-snug">{msg}</p>
        </div>
      </CardContent>
    </Card>
  );
}
