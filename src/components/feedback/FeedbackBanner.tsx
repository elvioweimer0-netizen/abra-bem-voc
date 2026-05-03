import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { useActiveCycle, useAlreadyAnswered, useMyManager } from "@/hooks/useManagerFeedback";
import { useRole } from "@/hooks/useRole";

export function FeedbackBanner() {
  const navigate = useNavigate();
  const { cargo } = useRole();
  const eligible = ["colaborador", "encarregado", "lider_setor", "fiscal"].includes(cargo);
  const { data: cycle } = useActiveCycle();
  const { data: answered } = useAlreadyAnswered(cycle?.id);
  const { data: manager } = useMyManager();

  if (!eligible || !cycle || answered || !manager) return null;

  return (
    <Card className="mx-4 mt-3 border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Espelho trimestral aberto</p>
            <p className="text-xs text-muted-foreground">
              Avalie seu gerente de forma 100% anônima. Leva 1 minuto.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/feedback-gerente")}>Responder</Button>
      </CardContent>
    </Card>
  );
}
