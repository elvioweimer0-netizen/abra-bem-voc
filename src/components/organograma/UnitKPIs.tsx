import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Calendar, Users, ClipboardCheck, Ban } from "lucide-react";
import { detectUnitKind, getExpectedSlots } from "@/config/orgExpectations";
import type { UnitOrgData } from "@/hooks/useUnitOrgData";

function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function UnitKPIs({ data }: { data: UnitOrgData }) {
  const unit = data.unit;
  const kind = unit ? detectUnitKind(unit.code, unit.type) : "loja";
  const expectedSlots = unit ? getExpectedSlots(kind).length : 0;
  const totalPeople = data.people.length;

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
          .select("check_in_at, user_id, profiles:profiles!visit_check_ins_user_id_fkey(nome)")
          .eq("unit_id", unit!.id)
          .order("check_in_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const checklistRows = (checklist.data ?? []) as any[];
      const checklistAvg = checklistRows.length
        ? checklistRows.reduce((acc, r) => acc + Number(r.pct ?? 0), 0) / checklistRows.length
        : null;

      return {
        checklistAvg,
        advs: advs.count ?? 0,
        susps: susps.count ?? 0,
        lastVisit: visit.data
          ? { date: (visit.data as any).check_in_at, name: (visit.data as any).profiles?.nome ?? "—" }
          : null,
      };
    },
  });

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Pessoas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalPeople}<span className="text-sm font-normal text-muted-foreground"> / {expectedSlots} previstas</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><ClipboardCheck className="h-4 w-4" />Checklist (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{extras?.checklistAvg != null ? pct(extras.checklistAvg) : "—"}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Advertências 30d</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{extras?.advs ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs"><Ban className="h-3.5 w-3.5" />Suspensões 30d</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{extras?.susps ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4" />Última visita</CardTitle>
        </CardHeader>
        <CardContent>
          {extras?.lastVisit ? (
            <>
              <p className="text-sm font-semibold">{new Date(extras.lastVisit.date).toLocaleDateString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{extras.lastVisit.name}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem registros</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
