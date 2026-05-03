import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMyDayOverview, useStartMyDay } from "@/hooks/useDayStart";
import { useAuth } from "@/contexts/AuthContext";
import { Smile, ClipboardList, AlertTriangle, CalendarClock, Award, Cake, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export function IniciarMeuDiaModal({ open, onOpenChange }: Props) {
  const { profile } = useAuth();
  const { data, isLoading } = useMyDayOverview();
  const startMutation = useStartMyDay();
  const firstName = profile?.nome?.split(" ")[0] ?? "time Curió";

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(data ?? {});
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const aniversariantes = data?.aniversariantes_hoje ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bom dia, {firstName}! 🌅</DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Sua loja agora</h3>
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="p-3 text-center">
                  <Smile className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <div className="text-lg font-bold">{data?.mood_avg_today?.toFixed(1) ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">Humor médio</div>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <ClipboardList className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <div className="text-lg font-bold">{data?.checklist_pendente_count ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Checklists pendentes</div>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <div className="text-lg font-bold">{data?.ocorrencias_abertas_count ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Ocorrências (7d)</div>
                </CardContent></Card>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Próxima reunião</h3>
              <Card><CardContent className="flex items-center gap-3 p-4">
                <CalendarClock className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="font-semibold">Reunião 9:30 — Daily Huddle</div>
                  <div className="text-xs text-muted-foreground">Pauta sugerida disponível</div>
                </div>
                <Button asChild size="sm" variant="outline"><Link to="/daily-huddle" onClick={() => onOpenChange(false)}>Abrir</Link></Button>
              </CardContent></Card>
            </section>

            {data?.ultimo_curio_ouro && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Último Curió de Ouro recebido</h3>
                <Card className="border-primary/30 bg-primary/5"><CardContent className="flex gap-3 p-4">
                  <Award className="h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm italic">"{data.ultimo_curio_ouro.mensagem}"</p>
                </CardContent></Card>
              </section>
            )}

            {aniversariantes.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Aniversariantes hoje 🎉</h3>
                <div className="flex flex-wrap gap-2">
                  {aniversariantes.map((a) => (
                    <span key={a.user_id} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm">
                      <Cake className="h-3 w-3" /> {a.nome}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <Button
              onClick={handleStart}
              disabled={startMutation.isPending || data?.day_started_today}
              className="w-full"
              size="lg"
            >
              {data?.day_started_today ? "Dia já iniciado ✓" : startMutation.isPending ? "Iniciando..." : "Iniciar agora"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
