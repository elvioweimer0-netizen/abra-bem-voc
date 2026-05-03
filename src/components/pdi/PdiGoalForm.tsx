import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useCreateGoal, usePeopleByUnit, currentTrimestre } from "@/hooks/usePdi";

const LEAD_ROLES = ["encarregado", "lider_setor", "fiscal", "colaborador"];

export function PdiGoalForm({
  open,
  onClose,
  defaultEncarregadoId,
  defaultUnitId,
}: {
  open: boolean;
  onClose: () => void;
  defaultEncarregadoId?: string;
  defaultUnitId?: string;
}) {
  const { data: units } = useAccessibleUnits();
  const [unitId, setUnitId] = useState<string>(defaultUnitId ?? "");
  const [encarregadoId, setEncarregadoId] = useState<string>(defaultEncarregadoId ?? "");
  const [trimestre, setTrimestre] = useState<number>(currentTrimestre());
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [metaValor, setMetaValor] = useState<string>("");
  const [metaUnidade, setMetaUnidade] = useState("");
  const [prazo, setPrazo] = useState<string>("");

  const { data: people } = usePeopleByUnit(unitId || null);
  const filteredPeople = useMemo(
    () => (people ?? []).filter((p: any) => LEAD_ROLES.includes(p.cargo)),
    [people]
  );

  const create = useCreateGoal();

  const valid =
    unitId && encarregadoId && titulo.length >= 5 && titulo.length <= 100 && descricao.trim().length > 0;

  const submit = async () => {
    await create.mutateAsync({
      encarregado_user_id: encarregadoId,
      unit_id: unitId,
      trimestre,
      ano,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      meta_valor: metaValor ? Number(metaValor) : null,
      meta_unidade: metaUnidade || null,
      prazo: prazo || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova meta de PDI</DialogTitle></DialogHeader>

        <div className="grid gap-3">
          <div>
            <Label>Unidade</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(units ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.code} · {u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Encarregado</Label>
            <Select value={encarregadoId} onValueChange={setEncarregadoId} disabled={!unitId}>
              <SelectTrigger><SelectValue placeholder={unitId ? "Selecione" : "Escolha a unidade"} /></SelectTrigger>
              <SelectContent>
                {filteredPeople.map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.nome} · {p.cargo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Trimestre</Label>
              <Select value={String(trimestre)} onValueChange={(v) => setTrimestre(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={String(q)}>{q}º</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label>Título (5–100)</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={100} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Meta (valor)</Label>
              <Input type="number" value={metaValor} onChange={(e) => setMetaValor(e.target.value)} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={metaUnidade} onChange={(e) => setMetaUnidade(e.target.value)} placeholder="ex: %, R$, un" />
            </div>
          </div>

          <div>
            <Label>Prazo</Label>
            <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valid || create.isPending}>Criar meta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
