import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AniversarianteHoje = {
  user_id: string;
  nome: string;
  foto_url: string | null;
  cargo: string | null;
  cargo_titulo: string | null;
  setor: string | null;
  unidade: string | null;
  dia: number;
  mes: number;
};

export type AniversarianteProximo = AniversarianteHoje & { days_ahead: number };

function todaySpDate(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date());
}

export function useAniversariantesHoje() {
  return useQuery({
    queryKey: ["aniversariantes-hoje"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("v_aniversariantes_hoje").select("*");
      if (error) throw error;
      return (data ?? []) as AniversarianteHoje[];
    },
  });
}

export function useAniversariantesProximos7d() {
  return useQuery({
    queryKey: ["aniversariantes-7d"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_aniversariantes_proximos_7d")
        .select("*")
        .gte("days_ahead", 1)
        .lte("days_ahead", 7)
        .order("days_ahead", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AniversarianteProximo[];
    },
  });
}

export type BirthdayWish = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message_text: string;
  created_at: string;
  from?: { nome: string | null; foto_url: string | null } | null;
};

export function useBirthdayWishesFor(toUserId: string | undefined, dayOnly = true) {
  return useQuery({
    queryKey: ["birthday-wishes", toUserId, dayOnly ? todaySpDate() : "all"],
    enabled: !!toUserId,
    queryFn: async () => {
      let q = supabase.from("birthday_messages").select("*").eq("to_user_id", toUserId!).order("created_at", { ascending: false });
      if (dayOnly) {
        const today = todaySpDate();
        q = q.gte("created_at", `${today}T00:00:00-03:00`).lte("created_at", `${today}T23:59:59-03:00`);
      }
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as BirthdayWish[];
      const ids = Array.from(new Set(rows.map((r) => r.from_user_id)));
      const map: Record<string, { nome: string | null; foto_url: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id,nome,foto_url").in("user_id", ids);
        (profs ?? []).forEach((p: any) => { map[p.user_id] = { nome: p.nome, foto_url: p.foto_url }; });
      }
      return rows.map((r) => ({ ...r, from: map[r.from_user_id] ?? null }));
    },
  });
}

/** Returns set of to_user_ids the current user already wished today. */
export function useMyTodayWishes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-today-wishes", user?.id, todaySpDate()],
    enabled: !!user,
    queryFn: async () => {
      const today = todaySpDate();
      const { data, error } = await supabase.from("birthday_messages")
        .select("to_user_id")
        .eq("from_user_id", user!.id)
        .gte("created_at", `${today}T00:00:00-03:00`)
        .lte("created_at", `${today}T23:59:59-03:00`);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.to_user_id as string));
    },
  });
}

export function useSendBirthdayWish() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async ({ toUserId, message }: { toUserId: string; message?: string }) => {
      if (!user) throw new Error("not authenticated");
      const text = (message?.trim() || "Parabéns! 🎉").slice(0, 500);
      const { error } = await supabase.from("birthday_messages").insert({
        from_user_id: user.id, to_user_id: toUserId, message_text: text,
      });
      if (error) throw error;
      // best-effort: auto-praise if recipient has team_members
      try {
        const { data: tms } = await (supabase as any).from("team_members")
          .select("id,unit_id,ativo").eq("user_id", toUserId).eq("ativo", true);
        if (tms && tms.length) {
          const tm = tms.find((t: any) => t.unit_id === (profile as any)?.unit_id) ?? tms[0];
          const motivoBase = `Parabéns pelo seu aniversário! 🎂`;
          const motivo = (text && text !== "Parabéns! 🎉") ? `${motivoBase} ${text}` : `${motivoBase} Tudo de melhor pra você!`;
          await (supabase as any).from("praises").insert({
            autor_id: user.id, destinatario_id: tm.id, unit_id: tm.unit_id,
            categoria: "aniversario", publico: true, motivo,
          });
        }
      } catch { /* silent */ }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-today-wishes"] });
      qc.invalidateQueries({ queryKey: ["birthday-wishes"] });
    },
  });
}
