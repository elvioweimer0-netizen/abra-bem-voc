import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TODAY = () => new Date().toISOString().slice(0, 10);

export function useMasterSnapshot() {
  return useQuery({
    queryKey: ["master_snapshot", TODAY()],
    queryFn: async () => {
      const { data } = await supabase
        .from("master_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
}

export function useNetworkUnits() {
  return useQuery({
    queryKey: ["master_units"],
    queryFn: async () => {
      const { data } = await supabase
        .from("units")
        .select("id,code,name,type,active")
        .eq("active", true)
        .order("code");
      return data ?? [];
    },
  });
}

export function useNetworkSalesToday() {
  const { data: units = [] } = useNetworkUnits();
  return useQuery({
    queryKey: ["network_sales_today", units.map((u) => u.id).join(",")],
    enabled: units.length > 0,
    queryFn: async () => {
      const today = TODAY();
      const lojas = units.filter((u) => u.type === "loja");
      const { data: metrics } = await supabase
        .from("sales_metrics")
        .select("unit_id,revenue,transactions")
        .eq("metric_date", today)
        .in("unit_id", lojas.map((u) => u.id));
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const { data: targets } = await supabase
        .from("sales_targets")
        .select("unit_id,target_revenue,target_transactions")
        .eq("year", y)
        .eq("month", m)
        .in("unit_id", lojas.map((u) => u.id));
      const daysInMonth = new Date(y, m, 0).getDate();
      const dayOfMonth = now.getDate();
      const byUnit = lojas.map((u) => {
        const met = (metrics ?? []).filter((x) => x.unit_id === u.id);
        const rev = met.reduce((s, r) => s + Number(r.revenue || 0), 0);
        const tx = met.reduce((s, r) => s + Number(r.transactions || 0), 0);
        const tgt = (targets ?? []).find((t) => t.unit_id === u.id);
        const dailyTarget = tgt ? Number(tgt.target_revenue) / daysInMonth : 0;
        const proRated = dailyTarget * dayOfMonth;
        const monthTarget = tgt ? Number(tgt.target_revenue) : 0;
        return {
          unit: u,
          revenue_today: rev,
          tx_today: tx,
          target_today: dailyTarget,
          target_month: monthTarget,
          target_pro_rated: proRated,
          achievement_pct: dailyTarget > 0 ? (rev / dailyTarget) * 100 : null,
        };
      });
      const totalRev = byUnit.reduce((s, x) => s + x.revenue_today, 0);
      const totalTarget = byUnit.reduce((s, x) => s + x.target_today, 0);
      const okCount = byUnit.filter((x) => (x.achievement_pct ?? 0) >= 100).length;
      return {
        byUnit,
        totalRev,
        totalTarget,
        achievementPct: totalTarget > 0 ? (totalRev / totalTarget) * 100 : null,
        okCount,
        totalLojas: lojas.length,
      };
    },
  });
}

export function useNetworkUrgencias() {
  return useQuery({
    queryKey: ["network_urgencias"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const [inc, complaints] = await Promise.all([
        supabase
          .from("safety_incidents")
          .select("id,unit_id,title,created_at,severity,status")
          .eq("severity", "muito_grave")
          .neq("status", "fechado"),
        supabase
          .from("customer_complaints")
          .select("id,unit_id,subject,created_at,status")
          .neq("status", "resolvida")
          .lt("created_at", threeDaysAgo),
      ]);
      const incidents = (inc.data as any[]) ?? [];
      const complaintList = (complaints.data as any[]) ?? [];
      return {
        incidents,
        complaints: complaintList,
        total: incidents.length + complaintList.length,
        sevenDaysAgo,
      };
    },
  });
}

export function useGerentesOverview() {
  return useQuery({
    queryKey: ["gerentes_overview"],
    queryFn: async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,user_id,nome,cargo,unit_id,unidade,foto_url,ativo")
        .eq("cargo", "gerente_loja")
        .eq("ativo", true);
      const list = (profs as any[]) ?? [];
      const userIds = list.map((p) => p.user_id).filter(Boolean);
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const [oneOnOnes, scoresRes] = await Promise.all([
        userIds.length
          ? supabase
              .from("master_one_on_ones")
              .select("gerente_user_id,scheduled_for,completed_at")
              .in("gerente_user_id", userIds)
              .order("scheduled_for", { ascending: false })
          : Promise.resolve({ data: [] }),
        userIds.length
          ? supabase
              .from("manager_scores")
              .select("user_id,final_score,calculated_at")
              .in("user_id", userIds)
              .gte("calculated_at", since)
              .order("calculated_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      const oneOnOnesList = (oneOnOnes.data as any[]) ?? [];
      const scoresList = (scoresRes.data as any[]) ?? [];
      return list.map((p) => {
        const last1on1 = oneOnOnesList.find((x) => x.gerente_user_id === p.user_id && x.completed_at);
        const lastScore = scoresList.find((s) => s.user_id === p.user_id);
        const prevScore = scoresList.filter((s) => s.user_id === p.user_id)[1];
        const days = last1on1 ? Math.floor((Date.now() - new Date(last1on1.completed_at).getTime()) / 86400000) : null;
        return {
          ...p,
          last_1on1: last1on1?.completed_at ?? null,
          days_since_1on1: days,
          score: lastScore?.final_score ?? null,
          score_delta: lastScore && prevScore ? Number(lastScore.final_score) - Number(prevScore.final_score) : null,
        };
      });
    },
  });
}

export function usePendingDecisions() {
  return useQuery({
    queryKey: ["pending_decisions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("master_pending_decisions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useMasterPinnedItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["master_pinned", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("master_pinned_items")
        .select("*")
        .eq("master_user_id", user!.id)
        .order("position");
      return data ?? [];
    },
  });
}

export function useMasterAgenda() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["master_agenda", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date().toISOString();
      const [oneOnOnes, visits] = await Promise.all([
        supabase
          .from("master_one_on_ones")
          .select("*")
          .gte("scheduled_for", since)
          .order("scheduled_for"),
        supabase
          .from("master_visits")
          .select("*")
          .gte("scheduled_for", new Date().toISOString().slice(0, 10))
          .order("scheduled_for"),
      ]);
      return {
        oneOnOnes: (oneOnOnes.data as any[]) ?? [],
        visits: (visits.data as any[]) ?? [],
      };
    },
  });
}
