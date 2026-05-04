import { useState } from "react";
import { useSalesTargets, useUpsertSalesTarget } from "@/hooks/useSalesTargets";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminMetasPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: targets = [] } = useSalesTargets(year, month);
  const { data: units = [] } = useQuery({
    queryKey: ["units-list-admin-metas"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("units").select("id, name, code").order("name");
      return (data ?? []) as { id: string; name: string; code: string }[];
    },
  });

  const upsert = useUpsertSalesTarget();
  const targetMap = new Map(targets.map((t) => [t.unit_id, t]));
  const [edits, setEdits] = useState<Record<string, { rev: string; tx: string }>>({});

  const save = (unitId: string) => {
    const e = edits[unitId];
    const cur = targetMap.get(unitId);
    upsert.mutate({
      unit_id: unitId,
      year,
      month,
      target_revenue: Number((e?.rev ?? cur?.target_revenue ?? 0).toString().replace(",", ".")),
      target_transactions: parseInt((e?.tx ?? cur?.target_transactions ?? 0).toString(), 10) || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Metas mensais</h1>
        <p className="text-sm text-muted-foreground">Defina meta de receita e transações por unidade.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || year)} className="w-24" />
            <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(parseInt(e.target.value) || month)} className="w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade</TableHead>
                <TableHead>Meta receita</TableHead>
                <TableHead>Meta transações</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => {
                const cur = targetMap.get(u.id);
                const e = edits[u.id];
                return (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}<div className="text-xs text-muted-foreground">{cur ? fmt(Number(cur.target_revenue)) : "—"}</div></TableCell>
                    <TableCell><Input value={e?.rev ?? cur?.target_revenue ?? ""} onChange={(ev) => setEdits((s) => ({ ...s, [u.id]: { ...(s[u.id] ?? { tx: "" }), rev: ev.target.value } }))} placeholder="0,00" /></TableCell>
                    <TableCell><Input value={e?.tx ?? cur?.target_transactions ?? ""} onChange={(ev) => setEdits((s) => ({ ...s, [u.id]: { ...(s[u.id] ?? { rev: "" }), tx: ev.target.value } }))} placeholder="0" /></TableCell>
                    <TableCell><Button size="sm" onClick={() => save(u.id)} disabled={upsert.isPending}>Salvar</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
