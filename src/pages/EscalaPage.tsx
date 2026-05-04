import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useShifts } from "@/hooks/useShifts";
import { ShiftGrid } from "@/components/shifts/ShiftGrid";
import { CoverageChart } from "@/components/shifts/CoverageChart";
import { NovoTurnoModal } from "@/components/shifts/NovoTurnoModal";

export default function EscalaPage() {
  const { profile } = useAuth();
  const { data: units = [] } = useAccessibleUnits();
  const [unitId, setUnitId] = useState<string>("");
  const [view, setView] = useState<"semana" | "mes">("semana");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [presetCell, setPresetCell] = useState<{ user_id?: string; date?: string }>({});

  useEffect(() => {
    if (!unitId && units.length > 0) {
      setUnitId(profile?.unit_id ?? units[0].id);
    }
  }, [units, unitId, profile]);

  const { from, to, days, weekStart } = useMemo(() => {
    if (view === "semana") {
      const ws = startOfWeek(anchor, { weekStartsOn: 1 });
      return { from: format(ws, "yyyy-MM-dd"), to: format(addDays(ws, 6), "yyyy-MM-dd"), days: 7, weekStart: ws };
    }
    const ms = startOfMonth(anchor);
    const me = endOfMonth(anchor);
    const dayCount = Math.ceil((me.getTime() - ms.getTime()) / 86400000) + 1;
    return { from: format(ms, "yyyy-MM-dd"), to: format(me, "yyyy-MM-dd"), days: dayCount, weekStart: ms };
  }, [view, anchor]);

  const { data: shifts = [] } = useShifts(unitId, from, to);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Escala de Turnos</h1>
              <p className="text-sm text-muted-foreground">Arraste turnos pra mover. Conflitos em vermelho.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Unidade" /></SelectTrigger>
                <SelectContent>{units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList><TabsTrigger value="semana">Semana</TabsTrigger><TabsTrigger value="mes">Mês</TabsTrigger></TabsList>
              </Tabs>
              <Button variant="outline" size="icon" onClick={() => setAnchor(addDays(anchor, view === "semana" ? -7 : -30))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setAnchor(addDays(anchor, view === "semana" ? 7 : 30))}><ChevronRight className="h-4 w-4" /></Button>
              <Button onClick={() => { setPresetCell({}); setModalOpen(true); }} disabled={!unitId}><Plus className="mr-1 h-4 w-4" />Novo turno</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {unitId && (
        <Card><CardContent className="p-2">
          <ShiftGrid
            unitId={unitId}
            shifts={shifts}
            weekStart={weekStart}
            days={days}
            onCellClick={(user_id, date) => { setPresetCell({ user_id, date }); setModalOpen(true); }}
          />
        </CardContent></Card>
      )}

      {shifts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Cobertura por hora (período)</h2>
            <CoverageChart shifts={shifts} />
          </CardContent>
        </Card>
      )}

      {unitId && (
        <NovoTurnoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          unitId={unitId}
          defaultDate={presetCell.date}
          defaultUserId={presetCell.user_id}
        />
      )}
    </div>
  );
}
