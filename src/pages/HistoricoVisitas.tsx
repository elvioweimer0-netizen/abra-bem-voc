import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const db = supabase as any;

type Visit = {
  id: string;
  user_id: string;
  unit_id: string;
  completion_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  observacao: string | null;
};

type Unit = { id: string; name: string };
type Profile = { user_id: string; nome: string };

export default function HistoricoVisitas() {
  const { isAdmin, isSupervisor } = useRole();
  const allowed = isAdmin || isSupervisor;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [unitFilter, setUnitFilter] = useState("__all__");
  const [supFilter, setSupFilter] = useState("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<{ visit: Visit; items: any[] } | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const [u, v] = await Promise.all([
        db.from("units").select("id, name").eq("active", true),
        db.from("visit_check_ins").select("*").order("check_in_at", { ascending: false }).limit(500),
      ]);
      setUnits(u.data || []);
      const vs = (v.data || []) as Visit[];
      setVisits(vs);
      const ids = Array.from(new Set(vs.map((x) => x.user_id)));
      if (ids.length) {
        const { data: ps } = await db.from("profiles").select("user_id, nome").in("user_id", ids);
        setProfiles(ps || []);
      }
    })();
  }, [allowed]);

  const profileMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.user_id, p.nome])), [profiles]);
  const unitMap = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.name])), [units]);

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      if (unitFilter !== "__all__" && v.unit_id !== unitFilter) return false;
      if (supFilter !== "__all__" && v.user_id !== supFilter) return false;
      const d = v.check_in_at.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [visits, unitFilter, supFilter, dateFrom, dateTo]);

  const openDetail = async (visit: Visit) => {
    if (!visit.completion_id) {
      setDetail({ visit, items: [] });
      return;
    }
    const { data: resps } = await db
      .from("checklist_item_responses")
      .select("id, item_id, resposta, foto_url, observacao, completed_at, item:checklist_items(descricao, ordem, tipo_resposta)")
      .eq("completion_id", visit.completion_id);
    setDetail({ visit, items: resps || [] });
  };

  if (!allowed) return <Navigate to="/" replace />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Visitas</h1>
        <p className="text-sm text-muted-foreground">Filtre por unidade, supervisor e período.</p>
      </header>

      <Card className="grid gap-3 p-4 md:grid-cols-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Unidade</label>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Supervisor</label>
          <Select value={supFilter} onValueChange={setSupFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma visita encontrada.</Card>}
        {filtered.map((v) => (
          <Card key={v.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{unitMap[v.unit_id] || "Unidade"}</p>
              <p className="text-xs text-muted-foreground">
                {profileMap[v.user_id] || "Supervisor"} · {new Date(v.check_in_at).toLocaleString("pt-BR")}
                {v.check_out_at ? ` → ${new Date(v.check_out_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : " · em andamento"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openDetail(v)}>Ver detalhes</Button>
          </Card>
        ))}
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da visita</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {unitMap[detail.visit.unit_id]} · {profileMap[detail.visit.user_id]}
                <br />
                {new Date(detail.visit.check_in_at).toLocaleString("pt-BR")}
              </p>
              {detail.visit.observacao && <p className="text-sm">📝 {detail.visit.observacao}</p>}
              {detail.items.length === 0 && <p className="text-sm text-muted-foreground">Sem checklist preenchido.</p>}
              {detail.items
                .sort((a, b) => (a.item?.ordem || 0) - (b.item?.ordem || 0))
                .map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">{r.item?.descricao}</p>
                    <p className="text-xs text-muted-foreground">Resposta: {r.resposta || "—"}</p>
                    {r.observacao && <p className="text-xs">Obs: {r.observacao}</p>}
                    {r.foto_url && <img src={r.foto_url} alt="foto" className="mt-2 max-h-48 rounded border border-border object-cover" />}
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
