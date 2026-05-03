import { useState } from "react";
import { useChurnRiskList, SIGNAL_LABELS, STATUS_LABELS } from "@/hooks/useChurnRisk";
import { ChurnEthicsDisclaimer } from "@/components/churn/ChurnEthicsDisclaimer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function scoreColor(score: number) {
  if (score >= 80) return "bg-destructive text-destructive-foreground";
  if (score >= 65) return "bg-orange-500 text-white";
  return "bg-yellow-500 text-white";
}

export default function AdminRiscoChurn() {
  const [unitId, setUnitId] = useState<string>("all");
  const [status, setStatus] = useState<string>("ativo");
  const navigate = useNavigate();

  const { data: units } = useQuery({
    queryKey: ["units-min"],
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data, isLoading } = useChurnRiskList({
    unitId: unitId === "all" ? undefined : unitId,
    status: status === "all" ? undefined : status,
  });

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Risco de churn</h1>
        <p className="text-sm text-muted-foreground">Painel para RH e supervisão.</p>
      </div>

      <ChurnEthicsDisclaimer />

      <div className="flex flex-wrap gap-3">
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units?.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Sinais</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detectado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Carregando…</TableCell></TableRow>
              ) : !data?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhum registro</TableCell></TableRow>
              ) : data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.profile?.nome ?? "—"}</TableCell>
                  <TableCell>{r.unit?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={scoreColor(r.risk_score)}>{Math.round(r.risk_score)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {r.signals.map((s) => (
                        <Badge key={s.code} variant="secondary" className="text-[10px]">{SIGNAL_LABELS[s.code] ?? s.code}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{STATUS_LABELS[r.status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.calculated_at}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/risco-churn/${r.user_id}`)}>Abrir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
