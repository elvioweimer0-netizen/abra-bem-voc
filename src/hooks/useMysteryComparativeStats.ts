import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UnitStat = {
  unit_id: string;
  unit_code: string | null;
  unit_name: string | null;
  visits: number;
  avg_score: number;
};

export type CriterionTrend = {
  criterion_code: string;
  criterion_name: string;
  avg_score: number;
};

export function useMysteryComparativeStats(opts: { from?: string | null } = {}) {
  return useQuery({
    queryKey: ["mystery_comparative", opts],
    queryFn: async () => {
      let q = (supabase as any)
        .from("mystery_visits")
        .select(`
          target_unit_id, overall_score, visit_date,
          unit:units!mystery_visits_target_unit_id_fkey(code, name)
        `)
        .not("overall_score", "is", null)
        .limit(1000);
      if (opts.from) q = q.gte("visit_date", opts.from);
      const { data, error } = await q;
      if (error) throw error;

      const byUnit = new Map<string, UnitStat>();
      for (const row of (data ?? []) as any[]) {
        const k = row.target_unit_id;
        const cur = byUnit.get(k) ?? {
          unit_id: k,
          unit_code: row.unit?.code ?? null,
          unit_name: row.unit?.name ?? null,
          visits: 0,
          avg_score: 0,
        };
        cur.visits += 1;
        cur.avg_score += Number(row.overall_score);
        byUnit.set(k, cur);
      }
      const units: UnitStat[] = Array.from(byUnit.values()).map((u) => ({
        ...u,
        avg_score: u.visits ? Number((u.avg_score / u.visits).toFixed(2)) : 0,
      })).sort((a, b) => b.avg_score - a.avg_score);

      // Criterion averages
      let cq = (supabase as any)
        .from("mystery_visit_scores")
        .select(`
          score,
          criterion:mystery_visit_criteria!mystery_visit_scores_criteria_id_fkey(code, name),
          visit:mystery_visits!mystery_visit_scores_visit_id_fkey(visit_date)
        `)
        .limit(2000);
      const { data: scoreRows, error: scErr } = await cq;
      if (scErr) throw scErr;

      const byCrit = new Map<string, { name: string; sum: number; n: number }>();
      for (const row of (scoreRows ?? []) as any[]) {
        if (opts.from && row.visit?.visit_date && row.visit.visit_date < opts.from) continue;
        const code = row.criterion?.code;
        if (!code) continue;
        const cur = byCrit.get(code) ?? { name: row.criterion?.name ?? code, sum: 0, n: 0 };
        cur.sum += Number(row.score);
        cur.n += 1;
        byCrit.set(code, cur);
      }
      const criteria: CriterionTrend[] = Array.from(byCrit.entries()).map(([code, v]) => ({
        criterion_code: code,
        criterion_name: v.name,
        avg_score: v.n ? Number((v.sum / v.n).toFixed(2)) : 0,
      }));

      return { units, criteria };
    },
  });
}
