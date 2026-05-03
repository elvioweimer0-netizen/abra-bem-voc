import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { matchesSetor, type SetorKey } from "@/lib/auditoriaSetores";

export type AuditoriaPeriodo = "hoje" | "ontem" | "semana" | "mes";

export type AuditoriaRow = {
  response_id: string;
  foto_url: string | null;
  observacao: string | null;
  completed_at: string | null;
  completion_id: string;
  item_id: string;
  item_text: string;
  template_id: string | null;
  template_name: string | null;
  completion_data: string | null;
  gestor_user_id: string | null;
  gestor_nome: string | null;
  gestor_cargo: string | null;
  unit_id: string | null;
  unit_code: string | null;
  unit_name: string | null;
};

function periodFrom(periodo: AuditoriaPeriodo): { from: string; to?: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (periodo === "hoje") return { from: start.toISOString() };
  if (periodo === "ontem") {
    const y = new Date(start);
    y.setDate(y.getDate() - 1);
    return { from: y.toISOString(), to: start.toISOString() };
  }
  if (periodo === "semana") {
    const w = new Date(start);
    w.setDate(w.getDate() - 7);
    return { from: w.toISOString() };
  }
  const m = new Date(start);
  m.setDate(1);
  return { from: m.toISOString() };
}

export function useAuditoriaResults(args: {
  periodo: AuditoriaPeriodo;
  unitIds: string[];
  itemId?: string | null;
  setor: SetorKey;
}) {
  const { periodo, unitIds, itemId, setor } = args;
  const range = periodFrom(periodo);
  return useQuery({
    queryKey: ["auditoria", periodo, unitIds.slice().sort().join(","), itemId ?? "_", setor],
    queryFn: async () => {
      try {
        let q = (supabase as any)
          .from("v_auditoria_visual")
          .select("*")
          .order("completed_at", { ascending: false })
          .limit(500);
        // Falamos de completed_at, mas se vier null usamos created_at via fallback no front
        q = q.gte("completed_at", range.from);
        if (range.to) q = q.lt("completed_at", range.to);
        if (itemId) q = q.eq("item_id", itemId);
        if (unitIds.length > 0) q = q.in("unit_id", unitIds);
        const { data, error } = await q;
        if (error) throw error;
        const rows = (data ?? []) as AuditoriaRow[];
        return rows.filter((r) => matchesSetor(`${r.item_text} ${r.template_name ?? ""}`, setor));
      } catch (e) {
        console.error("[auditoria] degraded:", e);
        return [] as AuditoriaRow[];
      }
    },
  });
}

export function useAuditoriaItems(setor: SetorKey) {
  return useQuery({
    queryKey: ["auditoria-items", setor],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_items")
        .select("id, descricao, requires_photo, template:checklist_templates(name)")
        .eq("requires_photo", true)
        .order("descricao");
      if (error) {
        console.error(error);
        return [] as { id: string; descricao: string }[];
      }
      const list = (data ?? [])
        .filter((it: any) => matchesSetor(`${it.descricao} ${it.template?.name ?? ""}`, setor))
        .map((it: any) => ({ id: it.id as string, descricao: it.descricao as string }));
      return list;
    },
  });
}

export function useSignedPhotoUrl(path: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["signed-photo", path],
    enabled: !!path && enabled,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      if (!path) return null;
      // Se já for URL completa, devolve direto
      if (/^https?:\/\//.test(path)) return path;
      const { data, error } = await supabase.storage
        .from("checklist-photos")
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
