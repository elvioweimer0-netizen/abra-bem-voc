import { useMemo, useState } from "react";
import { useMyGoals, currentTrimestre, type PdiGoal } from "@/hooks/usePdi";
import { PdiGoalCard } from "@/components/pdi/PdiGoalCard";
import { PdiGoalDetailDrawer } from "@/components/pdi/PdiGoalDetailDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Pdi() {
  const [trimestre, setTrimestre] = useState<number>(currentTrimestre());
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [selected, setSelected] = useState<PdiGoal | null>(null);

  const { data: goals, isLoading } = useMyGoals(trimestre, ano);

  const empty = !isLoading && (goals?.length ?? 0) === 0;

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu PDI</h1>
          <p className="text-sm text-muted-foreground">Suas metas trimestrais e o progresso de cada uma.</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(trimestre)} onValueChange={(v) => setTrimestre(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={String(q)}>{q}º Trim</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {empty && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma meta nesse trimestre. Aguarde a definição com seu gerente.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(goals ?? []).map((g) => (
          <PdiGoalCard key={g.id} goal={g} onClick={() => setSelected(g)} />
        ))}
      </div>

      <PdiGoalDetailDrawer goal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
