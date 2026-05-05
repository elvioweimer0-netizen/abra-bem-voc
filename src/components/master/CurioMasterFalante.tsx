import { Card, CardContent } from "@/components/ui/card";
import { useCurioMessage } from "@/hooks/useCurioMessage";
import { useHourContext } from "@/hooks/useHourContext";
import { useRole } from "@/hooks/useRole";

export function CurioMasterFalante() {
  const period = useHourContext();
  const { cargo } = useRole();
  const ctx = `master_saudacao_${period}`;
  const msg = useCurioMessage(ctx, cargo) || `Sua rede tá rodando. Foque hoje no que precisa de você.`;
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-2xl shrink-0" aria-hidden>
          🦜
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Curió Estratégico</p>
          <p className="text-sm text-foreground font-medium leading-snug mt-0.5">{msg}</p>
        </div>
      </CardContent>
    </Card>
  );
}
