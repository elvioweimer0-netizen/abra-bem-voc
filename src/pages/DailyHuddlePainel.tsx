import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRole } from "@/hooks/useRole";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useHuddlePanel, type HuddleReport } from "@/hooks/useDailyHuddle";
import { HuddlePanelCard } from "@/components/daily-huddle/HuddlePanelCard";
import { HuddleStatusBadge } from "@/components/daily-huddle/HuddleStatusBadge";

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtBRL = (v?: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DailyHuddlePainel() {
  const { isAdmin, isSupervisor } = useRole();
  const [date, setDate] = useState(todayISO());
  const [open, setOpen] = useState<HuddleReport | null>(null);
  const { data: units } = useAccessibleUnits();
  const { data: reports } = useHuddlePanel(date);

  const byUnit = useMemo(() => {
    const m = new Map<string, HuddleReport>();
    (reports ?? []).forEach((r) => m.set(r.unit_id, r));
    return m;
  }, [reports]);

  if (!isAdmin && !isSupervisor) return <Navigate to="/daily-huddle" replace />;

  const isToday = date === todayISO();

  return (
    <div className="container mx-auto max-w-6xl space-y-5 p-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Painel Daily Huddle</h1>
          <p className="text-sm text-muted-foreground">Status diário de todas as unidades</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(units ?? []).map((u) => {
          const r = byUnit.get(u.id);
          return (
            <HuddlePanelCard
              key={u.id}
              unitName={u.name ?? u.code}
              report={r}
              isToday={isToday}
              onClick={() => r && setOpen(r)}
            />
          );
        })}
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="overflow-y-auto">
          {open && (() => {
            const unit = units?.find((u) => u.id === open.unit_id);
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{unit?.name ?? unit?.code} · {new Date(open.report_date + "T12:00:00").toLocaleDateString("pt-BR")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Meta:</span>
                    <HuddleStatusBadge status={open.meta_status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-muted-foreground">Venda dia anterior</div><div className="font-medium">{fmtBRL(open.venda_dia_anterior)}</div></div>
                    <div><div className="text-xs text-muted-foreground">Meta de hoje</div><div className="font-medium">{fmtBRL(open.meta_dia)}</div></div>
                  </div>
                  <section>
                    <h3 className="font-semibold mb-1">Boletim do dia</h3>
                    <p className="whitespace-pre-wrap text-muted-foreground">{open.bo_dia || "—"}</p>
                  </section>
                  <section>
                    <h3 className="font-semibold mb-1">Informativos</h3>
                    <p className="whitespace-pre-wrap text-muted-foreground">{open.informativos || "—"}</p>
                  </section>
                  {open.observacao && (
                    <section>
                      <h3 className="font-semibold mb-1">Observação</h3>
                      <p className="whitespace-pre-wrap text-muted-foreground">{open.observacao}</p>
                    </section>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
