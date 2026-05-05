import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Calendar, Users, ClipboardCheck, Ban } from "lucide-react";
import { detectUnitKind, getExpectedSlots } from "@/config/orgExpectations";
import type { UnitOrgData } from "@/hooks/useUnitOrgData";

function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function UnitKPIs({ data, layout = "stack" }: { data: UnitOrgData; layout?: "stack" | "grid" }) {
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Pessoas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalPeople}<span className="text-sm font-normal text-muted-foreground"> / {expectedSlots}</span></p>
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

