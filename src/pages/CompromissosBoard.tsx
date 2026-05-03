import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  getMonday,
  getWeekRangeLabel,
  useCommitmentsBoard,
  type Commitment,
  type CommitmentStatus,
} from "@/hooks/useWeeklyCommitments";
import { CommitmentCard } from "@/components/commitments/CommitmentCard";

const COLUMNS: { status: CommitmentStatus; label: string }[] = [
  { status: "em_andamento", label: "Em andamento" },
  { status: "parcial", label: "Parcial" },
  { status: "cumprido", label: "Cumprido" },
  { status: "nao_cumprido", label: "Não cumprido" },
];

export default function CompromissosBoard() {
  const { isAdmin, isSupervisor } = useRole();
  const [week, setWeek] = useState(getMonday());
  const { data: commitments } = useCommitmentsBoard(week);

  const userIds = useMemo(() => Array.from(new Set((commitments ?? []).map((c) => c.user_id))), [commitments]);
  const { data: people } = useQuery({
    queryKey: ["commitments", "people", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, unidade")
        .in("user_id", userIds);
      if (error) throw error;
      return new Map((data ?? []).map((p: any) => [p.user_id, p]));
    },
  });

  if (!isAdmin && !isSupervisor) return <Navigate to="/compromissos" replace />;

  const grouped = useMemo(() => {
    const m: Record<CommitmentStatus, Commitment[]> = {
      em_andamento: [], parcial: [], cumprido: [], nao_cumprido: [], cancelado: [],
    };
    (commitments ?? []).forEach((c) => m[c.status].push(c));
    return m;
  }, [commitments]);

  return (
    <div className="container mx-auto max-w-7xl space-y-5 p-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Quadro de compromissos</h1>
          <p className="text-sm text-muted-foreground">Semana de {getWeekRangeLabel(week)}</p>
        </div>
        <Input type="date" value={week} onChange={(e) => setWeek(getMonday(new Date(e.target.value + "T12:00:00")))} className="w-44" />
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-lg border border-border bg-muted/20 p-3">
            <h2 className="mb-2 text-sm font-semibold flex items-center justify-between">
              {col.label}
              <span className="text-xs text-muted-foreground">{grouped[col.status].length}</span>
            </h2>
            <div className="space-y-2">
              {grouped[col.status].map((c) => {
                const p = people?.get(c.user_id) as any;
                return (
                  <CommitmentCard
                    key={c.id}
                    authorName={p?.nome ?? "—"}
                    unitName={p?.unidade}
                    commitment={c}
                  />
                );
              })}
              {!grouped[col.status].length && (
                <p className="text-xs text-muted-foreground text-center py-4">vazio</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
