import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { IniciarVisitaButton } from "./IniciarVisitaButton";

const db = supabase as any;

type Visit = {
  id: string;
  user_id: string;
  check_in_at: string;
  check_out_at: string | null;
  observacao: string | null;
  supervisor?: { nome: string | null } | null;
};

export function UnitVisitsPanel({
  open,
  onOpenChange,
  unitId,
  unitName,
  onVisitStarted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string | null;
  unitName: string;
  onVisitStarted?: () => void;
}) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unitId || !open) return;
    setLoading(true);
    (async () => {
      const { data } = await db
        .from("visit_check_ins")
        .select("id, user_id, check_in_at, check_out_at, observacao, supervisor:profiles!visit_check_ins_user_id_fkey(nome)")
        .eq("unit_id", unitId)
        .order("check_in_at", { ascending: false })
        .limit(5);

      // Fallback if FK relation isn't named — fetch profiles separately
      if (!data) {
        const r = await db.from("visit_check_ins").select("id, user_id, check_in_at, check_out_at, observacao").eq("unit_id", unitId).order("check_in_at", { ascending: false }).limit(5);
        const rows = (r.data || []) as Visit[];
        if (rows.length) {
          const ids = Array.from(new Set(rows.map((v) => v.user_id)));
          const { data: profs } = await db.from("profiles").select("user_id, nome").in("user_id", ids);
          const map = new Map((profs || []).map((p: any) => [p.user_id, p.nome]));
          rows.forEach((v) => (v.supervisor = { nome: map.get(v.user_id) ?? null }));
        }
        setVisits(rows);
      } else {
        setVisits(data as Visit[]);
      }
      setLoading(false);
    })();
  }, [unitId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{unitName}</SheetTitle>
          <SheetDescription>Últimas 5 visitas registradas</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && visits.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma visita registrada ainda.</p>
          )}
          {visits.map((v) => (
            <div key={v.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold text-foreground">{v.supervisor?.nome || "Supervisor"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(v.check_in_at).toLocaleString("pt-BR")} {v.check_out_at ? `→ ${new Date(v.check_out_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "· em andamento"}
              </p>
              {v.observacao && <p className="mt-1 text-xs text-foreground/80">{v.observacao}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6">
          {unitId && (
            <IniciarVisitaButton unitId={unitId} unitName={unitName} onStarted={() => { onOpenChange(false); onVisitStarted?.(); }} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
