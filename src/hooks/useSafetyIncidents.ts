import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type IncidentType =
  | "queda" | "corte" | "queimadura" | "choque_eletrico"
  | "quase_acidente" | "exposicao_quimica" | "assalto" | "outro";

export type IncidentSeverity =
  | "quase_acidente" | "leve" | "moderado" | "grave" | "muito_grave";

export type IncidentStatus = "aberto" | "investigando" | "corrigido" | "arquivado";

export type SafetyIncident = {
  id: string;
  registered_by_user_id: string;
  unit_id: string;
  setor: string | null;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  occurred_at: string;
  location_in_store: string | null;
  people_involved: string | null;
  action_immediate: string | null;
  photos: string[];
  root_cause: string | null;
  action_corrective: string | null;
  status: IncidentStatus;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type Filters = {
  unit_id?: string | null;
  incident_type?: IncidentType | null;
  severity?: IncidentSeverity | null;
  status?: IncidentStatus | null;
};

export function useSafetyIncidents(filters: Filters = {}) {
  return useQuery({
    queryKey: ["safety-incidents", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("safety_incidents")
        .select("*")
        .order("occurred_at", { ascending: false });

      if (filters.unit_id) q = q.eq("unit_id", filters.unit_id);
      if (filters.incident_type) q = q.eq("incident_type", filters.incident_type);
      if (filters.severity) q = q.eq("severity", filters.severity);
      if (filters.status) q = q.eq("status", filters.status);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SafetyIncident[];
    },
  });
}

export function useSafetyIncident(id: string | undefined) {
  return useQuery({
    queryKey: ["safety-incident", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("safety_incidents").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as SafetyIncident | null;
    },
  });
}

export function useCreateSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      unit_id: string;
      setor?: string | null;
      incident_type: IncidentType;
      severity: IncidentSeverity;
      description: string;
      occurred_at: string;
      location_in_store?: string | null;
      people_involved?: string | null;
      action_immediate?: string | null;
      photoFiles?: File[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Não autenticado");

      // Insert first (to get id)
      const { data: created, error: insErr } = await (supabase as any)
        .from("safety_incidents")
        .insert({
          registered_by_user_id: uid,
          unit_id: input.unit_id,
          setor: input.setor ?? null,
          incident_type: input.incident_type,
          severity: input.severity,
          description: input.description,
          occurred_at: input.occurred_at,
          location_in_store: input.location_in_store ?? null,
          people_involved: input.people_involved ?? null,
          action_immediate: input.action_immediate ?? null,
          photos: [],
        })
        .select("id, unit_id")
        .single();
      if (insErr) throw insErr;

      // Upload photos
      const urls: string[] = [];
      const files = input.photoFiles ?? [];
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${created.unit_id}/${created.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("safety-incident-photos").upload(path, file, { upsert: false });
        if (!upErr) urls.push(path);
      }
      if (urls.length > 0) {
        await (supabase as any)
          .from("safety_incidents")
          .update({ photos: urls })
          .eq("id", created.id);
      }
      return created.id as string;
    },
    onSuccess: (_id, vars) => {
      if (vars.severity === "quase_acidente") {
        toast.success("Obrigado por prevenir um acidente! 🛡️");
      } else {
        toast.success("Incidente registrado");
      }
      qc.invalidateQueries({ queryKey: ["safety-incidents"] });
      qc.invalidateQueries({ queryKey: ["safety-heatmap"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar incidente"),
  });
}

export function useUpdateSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      root_cause?: string | null;
      action_corrective?: string | null;
      status?: IncidentStatus;
    }) => {
      const patch: Record<string, any> = {};
      if (input.root_cause !== undefined) patch.root_cause = input.root_cause;
      if (input.action_corrective !== undefined) patch.action_corrective = input.action_corrective;
      if (input.status !== undefined) {
        patch.status = input.status;
        if (input.status === "corrigido") {
          patch.resolved_at = new Date().toISOString();
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user?.id) patch.resolved_by_user_id = userData.user.id;
        }
      }
      const { error } = await (supabase as any)
        .from("safety_incidents").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["safety-incidents"] });
      qc.invalidateQueries({ queryKey: ["safety-incident"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });
}

export function useSafetyHeatmap() {
  return useQuery({
    queryKey: ["safety-heatmap"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await (supabase as any)
        .from("safety_incidents")
        .select("unit_id, severity")
        .gte("occurred_at", since.toISOString());
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        map.set(r.unit_id, (map.get(r.unit_id) ?? 0) + 1);
      });
      return map;
    },
  });
}

export async function getSafetyPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from("safety-incident-photos")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
