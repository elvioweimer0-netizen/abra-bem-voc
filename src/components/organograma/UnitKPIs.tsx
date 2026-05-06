import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Calendar, Users, ClipboardCheck, Ban, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { detectUnitKind, getExpectedSlots } from "@/config/orgExpectations";
import { useRole } from "@/hooks/useRole";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { UnitOrgData } from "@/hooks/useUnitOrgData";

function pct(n: number) {
  return `${Math.round(n)}%`;
}

function isLoja(u: { code?: string | null; name?: string | null; type?: string | null } | null | undefined) {
  if (!u) return false;
  return (u.type ?? "").toLowerCase() === "loja";
}

function PessoasCardCidadeAlta({ data }: { data: UnitOrgData }) {
  const unit = data.unit!;
  const { isAdmin, isMaster } = useRole();
  const canEdit = isAdmin || isMaster;
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number>(0);

  const { data: unitExtra } = useQuery({
    queryKey: ["unit-total-desejado", unit.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from("units").select("total_desejado").eq("id", unit.id).maybeSingle();
      return (data?.total_desejado ?? 0) as number;
    },
  });

  const totalDesejado = unitExtra ?? 0;
  const totalAtual = data.people.length;
  const afastado = data.people.filter((p) => !!p.afastado_status).length;
  const totalAtivo = totalAtual - afastado;

  const ratio = totalDesejado > 0 ? totalAtual / totalDesejado : 0;
  const atualColor = ratio >= 0.9 ? "text-success" : ratio >= 0.7 ? "text-warning" : "text-destructive";
  const afastadoColor = afastado > 0 ? "text-warning" : "text-muted-foreground";

  const startEdit = () => {
    setValue(totalDesejado);
    setEditing(true);
  };

  const save = async () => {
    const { error } = await (supabase as any).from("units").update({ total_desejado: value }).eq("id", unit.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["unit-total-desejado", unit.id] });
    setEditing(false);
  };

  const Row = ({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-semibold tabular-nums", valueClass)}>{value}</span>
    </div>
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Pessoas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">Total desejado</span>
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-7 w-20 text-right"
                min={0}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save}><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground tabular-nums">{totalDesejado}</span>
              {canEdit && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        <Row label="Total atual" value={totalAtual} valueClass={atualColor} />
        <Row label="Afastado" value={afastado} valueClass={afastadoColor} />
        <div className="border-t border-border my-1" />
        <Row label="Total ativo" value={totalAtivo} valueClass="text-primary text-xl" />
      </CardContent>
    </Card>
  );
}

export function UnitKPIs({ data, layout = "stack" }: { data: UnitOrgData; layout?: "stack" | "grid" }) {
  const unit = data.unit;
  const kind = unit ? detectUnitKind(unit.code, unit.type) : "loja";
  const expectedSlots = unit ? getExpectedSlots(kind).length : 0;
  const totalPeople = data.people.length;
  const isCA = isCidadeAlta(unit);

  const { data: extras } = useQuery({
    queryKey: ["unit-kpis", unit?.id, unit?.code],
    enabled: !!unit,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const [checklist, advs, susps, visit] = await Promise.all([
        supabase
          .from("v_unit_checklist_progress")
          .select("pct, data")
          .eq("unit_id", unit!.id)
          .gte("data", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
        supabase
          .from("advertencias")
          .select("id", { count: "exact", head: true })
          .eq("unidade", (unit as any).name)
          .gte("created_at", since),
        supabase
          .from("suspensoes")
          .select("id", { count: "exact", head: true })
          .eq("unidade", (unit as any).name)
          .gte("created_at", since),
        supabase
          .from("visit_check_ins")
          .select("check_in_at, user_id")
          .eq("unit_id", unit!.id)
          .order("check_in_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const checklistRows = (checklist.data ?? []) as any[];
      const checklistAvg = checklistRows.length
        ? checklistRows.reduce((acc, r) => acc + Number(r.pct ?? 0), 0) / checklistRows.length
        : null;

      let lastVisit: { date: string; name: string } | null = null;
      if (visit.data) {
        const v = visit.data as any;
        const { data: prof } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", v.user_id)
          .maybeSingle();
        lastVisit = { date: v.check_in_at, name: (prof as any)?.nome ?? "—" };
      }

      return {
        checklistAvg,
        advs: advs.count ?? 0,
        susps: susps.count ?? 0,
        lastVisit,
      };
    },
  });

  const wrapperClass = layout === "grid"
    ? "grid grid-cols-2 md:grid-cols-5 gap-3"
    : "space-y-3";

  return (
    <div className={wrapperClass}>
      {isCA ? (
        <PessoasCardCidadeAlta data={data} />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Pessoas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPeople}<span className="text-sm font-normal text-muted-foreground"> / {expectedSlots}</span></p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4" />Checklist (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{extras?.checklistAvg != null ? pct(extras.checklistAvg) : "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4" />Advertências 30d</CardTitle>
        </CardHeader>
        <CardContent><p className="text-2xl font-bold">{extras?.advs ?? 0}</p></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Ban className="h-4 w-4" />Suspensões 30d</CardTitle>
        </CardHeader>
        <CardContent><p className="text-2xl font-bold">{extras?.susps ?? 0}</p></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4" />Última visita</CardTitle>
        </CardHeader>
        <CardContent>
          {extras?.lastVisit ? (
            <>
              <p className="text-sm font-semibold">{new Date(extras.lastVisit.date).toLocaleDateString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground truncate">{extras.lastVisit.name}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem registros</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

