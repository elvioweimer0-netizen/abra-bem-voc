import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type HuddleInput, type HuddleReport, type MetaStatus, useUpsertHuddle } from "@/hooks/useDailyHuddle";
import { META_OPTIONS } from "./HuddleStatusBadge";

type Props = {
  unitId: string;
  existing?: HuddleReport | null;
  reportDate?: string;
  onSaved?: () => void;
};

export function DailyHuddleForm({ unitId, existing, reportDate, onSaved }: Props) {
  const [bo, setBo] = useState("");
  const [info, setInfo] = useState("");
  const [vendaAnt, setVendaAnt] = useState<string>("");
  const [meta, setMeta] = useState<string>("");
  const [status, setStatus] = useState<MetaStatus>("no_caminho");
  const [obs, setObs] = useState("");
  const upsert = useUpsertHuddle();

  useEffect(() => {
    setBo(existing?.bo_dia ?? "");
    setInfo(existing?.informativos ?? "");
    setVendaAnt(existing?.venda_dia_anterior?.toString() ?? "");
    setMeta(existing?.meta_dia?.toString() ?? "");
    setStatus(existing?.meta_status ?? "no_caminho");
    setObs(existing?.observacao ?? "");
  }, [existing?.id]);

  const submit = async () => {
    const payload: HuddleInput = {
      unit_id: unitId,
      report_date: reportDate,
      bo_dia: bo,
      informativos: info,
      venda_dia_anterior: vendaAnt ? Number(vendaAnt) : null,
      meta_dia: meta ? Number(meta) : null,
      meta_status: status,
      observacao: obs,
    };
    await upsert.mutateAsync(payload);
    onSaved?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existing ? "Atualizar Daily de hoje" : "Registrar Daily de hoje"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bo">Boletim do dia (BO)</Label>
          <Textarea id="bo" rows={3} value={bo} onChange={(e) => setBo(e.target.value)} placeholder="Ocorrências, faltas, eventos relevantes" />
        </div>
        <div>
          <Label htmlFor="info">Informativos</Label>
          <Textarea id="info" rows={3} value={info} onChange={(e) => setInfo(e.target.value)} placeholder="Recados, campanhas, treinamentos" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="va">Venda dia anterior (R$)</Label>
            <Input id="va" inputMode="decimal" value={vendaAnt} onChange={(e) => setVendaAnt(e.target.value.replace(",", "."))} />
          </div>
          <div>
            <Label htmlFor="md">Meta de hoje (R$)</Label>
            <Input id="md" inputMode="decimal" value={meta} onChange={(e) => setMeta(e.target.value.replace(",", "."))} />
          </div>
          <div>
            <Label>Status da meta</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as MetaStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {META_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="obs">Observação</Label>
          <Textarea id="obs" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={upsert.isPending}>
            {existing ? "Atualizar Daily" : "Salvar Daily"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
