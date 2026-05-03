import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunrise, CheckCircle2 } from "lucide-react";
import { useMyDayOverview } from "@/hooks/useDayStart";
import { IniciarMeuDiaModal } from "./IniciarMeuDiaModal";

export function IniciarMeuDiaCard() {
  const [open, setOpen] = useState(false);
  const { data } = useMyDayOverview();
  const started = data?.day_started_today;
  const startedTime = data?.day_started_at
    ? new Date(data.day_started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {started ? (
              <CheckCircle2 className="h-8 w-8 text-primary" />
            ) : (
              <Sunrise className="h-8 w-8 text-primary" />
            )}
            <div>
              <h3 className="text-lg font-bold">
                {started ? `Dia iniciado às ${startedTime} ✓` : "Iniciar meu dia"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {started ? "Confira seu briefing de novo quando quiser" : "Briefing de turno em 1 clique"}
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} variant={started ? "outline" : "default"} size="lg">
            {started ? "Ver briefing" : "🌅 Iniciar meu dia"}
          </Button>
        </CardContent>
      </Card>
      <IniciarMeuDiaModal open={open} onOpenChange={setOpen} />
    </>
  );
}
