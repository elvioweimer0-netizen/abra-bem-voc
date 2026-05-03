import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useHuddleHistory, useTodayHuddle } from "@/hooks/useDailyHuddle";
import { DailyHuddleForm } from "@/components/daily-huddle/DailyHuddleForm";
import { HuddleStatusBadge } from "@/components/daily-huddle/HuddleStatusBadge";
import { Navigate } from "react-router-dom";
import { SuggestedAgendaCard } from "@/components/daily-huddle/SuggestedAgendaCard";

const DAYS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function DailyHuddle() {
  const { profile } = useAuth();
  const { isLider, isAdmin, isSupervisor } = useRole();
  const { data: units } = useAccessibleUnits();
  const profileUnit = (profile as any)?.unit_id as string | undefined;
  const canPickUnit = isAdmin || isSupervisor;

  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(profileUnit ?? undefined);
  const unitId = canPickUnit ? selectedUnit : profileUnit;

  const today = new Date();
  const dayName = DAYS_PT[today.getDay()];
  const dateLabel = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const isWeekday = today.getDay() >= 1 && today.getDay() <= 5;

  const { data: todayReport } = useTodayHuddle(unitId);
  const { data: history } = useHuddleHistory(unitId, 7);

  const unitOptions = useMemo(() => units ?? [], [units]);

  if (!isLider) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto max-w-3xl space-y-5 p-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Daily Huddle</h1>
          <p className="text-sm text-muted-foreground">{dayName} · {dateLabel}</p>
        </div>
        {canPickUnit && (
          <Select value={selectedUnit ?? ""} onValueChange={(v) => setSelectedUnit(v)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
            <SelectContent>
              {unitOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name ?? u.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {!unitId && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Selecione uma unidade para registrar ou consultar o Daily.</CardContent></Card>
      )}

      {unitId && (
        <SuggestedAgendaCard unitId={unitId} report={todayReport ?? null} />
      )}

      {unitId && isWeekday && (
        <DailyHuddleForm unitId={unitId} existing={todayReport ?? undefined} />
      )}

      {unitId && !isWeekday && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Daily só ocorre em dias úteis. Você ainda pode revisar o histórico abaixo.</CardContent></Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Últimos 7 dias</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!history?.length && <p className="text-sm text-muted-foreground">Sem registros ainda.</p>}
          {history?.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{new Date(r.report_date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</span>
                <HuddleStatusBadge status={r.meta_status} />
              </div>
              {r.bo_dia && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.bo_dia}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
