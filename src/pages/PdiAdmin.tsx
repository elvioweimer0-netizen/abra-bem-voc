import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminGoals, useProfilesByIds, currentTrimestre, STATUS_LABEL, type PdiGoal, type PdiStatus } from "@/hooks/usePdi";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { PdiGoalDetailDrawer } from "@/components/pdi/PdiGoalDetailDrawer";

export default function PdiAdmin() {
  const [trimestre, setTrimestre] = useState<number>(currentTrimestre());
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [unitId, setUnitId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [selected, setSelected] = useState<PdiGoal | null>(null);

  const { data: units } = useAccessibleUnits();
  const { data: goals } = useAdminGoals({
    trimestre, ano,
    unit_id: unitId || undefined,
    status: (status || undefined) as PdiStatus | undefined,
  });

  const grouped = useMemo(() => {
    const m = new Map<string, PdiGoal[]>();
    (goals ?? []).forEach((g) => {
      const arr = m.get(g.encarregado_user_id) ?? [];
      arr.push(g);
      m.set(g.encarregado_user_id, arr);
    });
    return m;
  }, [goals]);

  const ids = Array.from(grouped.keys());
  const { data: people } = useProfilesByIds(ids);
  const peopleMap = new Map((people ?? []).map((p: any) => [p.user_id, p]));
  const unitMap = new Map((units ?? []).map((u) => [u.id, u]));

  const computeAvg = (list: PdiGoal[]) => {
    const valid = list.filter((g) => g.meta_valor && g.meta_valor > 0);
    if (valid.length === 0) return null;
    const total = valid.reduce(
      (acc, g) => acc + Math.min(100, ((g.valor_atual ?? 0) / (g.meta_valor as number)) * 100),
      0
    );
    return Math.round(total / valid.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">PDI · Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Painel consolidado de todos os PDIs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={unitId || "_all"} onValueChange={(v) => setUnitId(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Loja" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas</SelectItem>
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
          <Select value={status || "_all"} onValueChange={(v) => setStatus(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos status</SelectItem>
              {(Object.keys(STATUS_LABEL) as PdiStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Encarregado</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Metas</TableHead>
              <TableHead className="text-right">% médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ids.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  Nenhum dado.
                </TableCell>
              </TableRow>
            )}
            {ids.map((uid) => {
              const list = grouped.get(uid) ?? [];
              const person = peopleMap.get(uid) as any;
              const unit = list[0]?.unit_id ? unitMap.get(list[0].unit_id) : null;
              const avg = computeAvg(list);
              return (
                <TableRow key={uid}>
                  <TableCell className="font-medium">{person?.nome ?? "—"}</TableCell>
                  <TableCell className="text-xs">{person?.cargo}</TableCell>
                  <TableCell className="text-xs">{(unit as any)?.code ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {list.slice(0, 3).map((g) => (
                        <Badge
                          key={g.id}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => setSelected(g)}
                        >
                          {g.titulo.slice(0, 24)}{g.titulo.length > 24 ? "…" : ""}
                        </Badge>
                      ))}
                      {list.length > 3 && (
                        <span className="text-xs text-muted-foreground self-center">+{list.length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {avg == null ? "—" : `${avg}%`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PdiGoalDetailDrawer goal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
