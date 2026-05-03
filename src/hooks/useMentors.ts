import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MentorRow {
  user_id: string;
  nome: string;
  cargo: string;
  cargo_titulo: string | null;
  foto_url: string | null;
  unit_id: string | null;
  unidade: string;
  topics: { id: string; name: string; icon: string | null; message: string | null }[];
}

export function useMentors(filters: { topicId?: string; unitId?: string } = {}) {
  return useQuery({
    queryKey: ["mentors", filters],
    queryFn: async (): Promise<MentorRow[]> => {
      let q = supabase
        .from("user_mentorship_offers")
        .select("user_id, message, topic_id, mentorship_topics!inner(id,name,icon,active,ordem)")
        .eq("active", true);
      if (filters.topicId) q = q.eq("topic_id", filters.topicId);
      const { data: offers, error } = await q;
      if (error) throw error;

      const userIds = [...new Set((offers ?? []).map((o: any) => o.user_id))];
      if (!userIds.length) return [];

      let pq = supabase
        .from("profiles")
        .select("user_id, nome, cargo, cargo_titulo, foto_url, unit_id, unidade, ativo")
        .in("user_id", userIds)
        .eq("ativo", true);
      if (filters.unitId) pq = pq.eq("unit_id", filters.unitId);
      const { data: profiles } = await pq;

      const byUser = new Map<string, MentorRow>();
      for (const p of profiles ?? []) {
        if (!p.user_id) continue;
        byUser.set(p.user_id, {
          user_id: p.user_id,
          nome: p.nome,
          cargo: p.cargo,
          cargo_titulo: p.cargo_titulo,
          foto_url: p.foto_url,
          unit_id: p.unit_id,
          unidade: p.unidade,
          topics: [],
        });
      }
      for (const o of offers ?? []) {
        const m = byUser.get((o as any).user_id);
        if (!m) continue;
        const t = (o as any).mentorship_topics;
        if (t?.active) {
          m.topics.push({ id: t.id, name: t.name, icon: t.icon, message: (o as any).message });
        }
      }
      return [...byUser.values()].filter((m) => m.topics.length > 0).sort((a, b) => a.nome.localeCompare(b.nome));
    },
  });
}
