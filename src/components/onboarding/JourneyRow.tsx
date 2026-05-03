import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useResendIncentive } from "@/hooks/useOnboarding";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function JourneyRow({ row, allowIncentive }: { row: any; allowIncentive?: boolean }) {
  const incentive = useResendIncentive();
  const pct = row.total_modules > 0 ? Math.round((row.completed_modules / row.total_modules) * 100) : 0;
  const daysLeft = differenceInDays(new Date(row.expected_completion_date), new Date());
  const initials = (row.profile?.nome || "?").split(" ").filter(Boolean).slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

  const send = async () => {
    try { await incentive.mutateAsync(row.user_id); toast.success("Incentivo enviado"); }
    catch (e: any) { toast.error(e.message || "Falha"); }
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold overflow-hidden">
            {row.profile?.foto_url ? <img src={row.profile.foto_url} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{row.profile?.nome ?? "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{row.profile?.cargo} · {row.profile?.unidade ?? "—"}</p>
          </div>
        </div>
        <div className="flex-1 min-w-0 md:max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{row.completed_modules}/{row.total_modules}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <div className="text-xs text-muted-foreground md:w-40">
          <p>Prazo: {format(new Date(row.expected_completion_date), "dd/MM", { locale: ptBR })}</p>
          <p>{daysLeft >= 0 ? `${daysLeft} dias restantes` : `${Math.abs(daysLeft)} dias atrasado`}</p>
          <p>Último acesso: {row.last_activity_at ? format(new Date(row.last_activity_at), "dd/MM", { locale: ptBR }) : "—"}</p>
        </div>
        {allowIncentive && row.status !== "concluido" && (
          <Button size="sm" variant="outline" onClick={send} disabled={incentive.isPending} className="gap-1">
            <Send className="h-3.5 w-3.5" /> Incentivar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
