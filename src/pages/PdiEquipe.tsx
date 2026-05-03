import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamGoals, useProfilesByIds, currentTrimestre, STATUS_LABEL, type PdiGoal } from "@/hooks/usePdi";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { PdiGoalForm } from "@/components/pdi/PdiGoalForm";
import { PdiGoalDetailDrawer } from "@/components/pdi/PdiGoalDetailDrawer";

export default function PdiEquipe() {
  const [trimestre, setTrimestre] = useState<number>(currentTrimestre());
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [unitId, setUnitId] = useState<string>("");
  const [selected, setSelected] = useState<PdiGoal | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultEnc, setDefaultEnc] = useState<string | undefined>();

  const { data: units } = useAccessibleUnits();
  const { data: goals } = useTeamGoals({ trimestre, ano, unit_id: unitId || undefined });

  // Group by encarregado
  const grouped = useMemo(() => {
    const m = new Map<string, PdiGoal[]>();
    (goals ?? []).forEach((g) => {
      const arr = m.get(g.encarregado_user_id) ?? [];
      arr.push(g);
      m.set(g.encarregado_user_id, arr);
    });
    return m;
  }, [goals]);

  const ids = useMemo(() => Array.from(grouped.keys()), [grouped]);
  const { data: people } = useProfilesByIds(ids);
  const peopleMap = new Map((people ?? []).map((p: any) => [p.user_id, p]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">PDI da Equipe</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o progresso da liderança da sua loja.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={unitId || "_all"} onValueChange={(v) => setUnitId(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Loja" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas as lojas</SelectItem>
              {(units ?? []).map((u) => <SelectItem key={u.id} value={u.id}>{u.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(trimestre)} onValueChange={(v) => setTrimestre(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={String(q)}>{q}º Trim</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[ano - 1, ano, ano + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setDefaultEnc(undefined); setFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Nova meta
          </Button>
        </div>
      </div>

      {ids.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma meta encontrada nos filtros atuais.
        </div>
      )}

      <div className="space-y-3">
        {ids.map((uid) => {
          const list = grouped.get(uid) ?? [];
          const person = peopleMap.get(uid) as any;
          const summary = list.slice(0, 3);
          return (
            <Card key={uid} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{person?.nome ?? "Colaborador"}</h3>
                  <p className="text-xs text-muted-foreground">{person?.cargo}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setDefaultEnc(uid); setFormOpen(true); }}>
                  <Plus className="mr-1 h-3 w-3" /> Nova meta
                </Button>
              </div>
              <ul className="mt-3 space-y-1">
                {summary.map((g) => (
                  <li
                    key={g.id}
                    onClick={() => setSelected(g)}
                    className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
                  >
                    <span className="line-clamp-1">{g.titulo}</span>
                    <Badge variant="outline" className="ml-2">{STATUS_LABEL[g.status]}</Badge>
                  </li>
                ))}
                {list.length > 3 && (
                  <li className="text-xs text-muted-foreground">+ {list.length - 3} outras</li>
                )}
              </ul>
            </Card>
          );
        })}
      </div>

      {formOpen && (
        <PdiGoalForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          defaultEncarregadoId={defaultEnc}
          defaultUnitId={unitId || undefined}
        />
      )}
      <PdiGoalDetailDrawer goal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
