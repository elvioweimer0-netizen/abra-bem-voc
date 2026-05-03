import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PollOption { id: string; label: string }
export interface Poll {
  id: string;
  author_user_id: string;
  unit_id: string | null;
  question: string;
  options: PollOption[];
  expires_at: string;
  target_roles: string[];
  allow_anonymous: boolean;
  status: "ativa" | "encerrada" | "cancelada";
  created_at: string;
  author?: { nome: string; foto_url: string | null } | null;
  unit?: { name: string } | null;
}

async function decoratePolls(rows: any[]): Promise<Poll[]> {
  if (!rows.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_user_id))];
  const unitIds = [...new Set(rows.map((r) => r.unit_id).filter(Boolean))];
  const [{ data: authors }, { data: units }] = await Promise.all([
    supabase.from("profiles").select("user_id, nome, foto_url").in("user_id", authorIds),
    unitIds.length
      ? supabase.from("units").select("id, name").in("id", unitIds as string[])
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const am = new Map((authors ?? []).map((a: any) => [a.user_id, a]));
  const um = new Map((units ?? []).map((u: any) => [u.id, u]));
  return rows.map((r) => ({
    ...r,
    options: Array.isArray(r.options) ? r.options : [],
    author: am.get(r.author_user_id) ?? null,
    unit: r.unit_id ? um.get(r.unit_id) ?? null : null,
  }));
}

export function usePolls(filter: "ativas" | "encerradas" | "minhas" = "ativas") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["polls", filter, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = (supabase as any).from("polls").select("*").order("created_at", { ascending: false });
      if (filter === "ativas") q = q.eq("status", "ativa").gt("expires_at", new Date().toISOString());
      else if (filter === "encerradas") q = q.in("status", ["encerrada", "cancelada"]);
      else if (filter === "minhas") q = q.eq("author_user_id", user!.id);
      const { data, error } = await q;
      if (error) throw error;
      return decoratePolls(data ?? []);
    },
    refetchInterval: 30_000,
  });
}

export function useEligibleActivePolls() {
  // RLS already restricts to eligible polls
  return usePolls("ativas");
}
