import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TvDisplay {
  id: string;
  unit_id: string;
  slug: string;
  display_token: string;
  name: string;
  active: boolean;
  slide_duration_seconds: number;
  created_at: string;
  updated_at: string;
  unit?: { id: string; name: string; code: string | null } | null;
}

export interface TvDisplayCard {
  id: string;
  display_id: string;
  card_type: string;
  ordem: number;
  enabled: boolean;
  config: Record<string, unknown>;
}

export const ALL_CARD_TYPES = [
  { type: "aniversariantes", label: "Aniversariantes do dia" },
  { type: "curio_ouro", label: "Curió de Ouro recente" },
  { type: "stories_unidade", label: "Stories da unidade (24h)" },
  { type: "top_pendencias", label: "Top 3 pendências" },
  { type: "compromissos_semana", label: "Compromissos cumpridos" },
  { type: "historias_curio", label: "Histórias do Curió" },
  { type: "avisos_importantes", label: "Avisos importantes" },
  { type: "conquistas_equipe", label: "Conquistas da equipe" },
  { type: "pilula_cultura", label: "Pílula de cultura" },
] as const;

export function useTvDisplays() {
  return useQuery({
    queryKey: ["tv-displays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tv_displays" as any)
        .select("*, unit:units(id, name, code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TvDisplay[];
    },
  });
}

export function useTvDisplayCards(displayId: string | undefined) {
  return useQuery({
    queryKey: ["tv-display-cards", displayId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tv_display_cards" as any)
        .select("*")
        .eq("display_id", displayId!)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TvDisplayCard[];
    },
    enabled: !!displayId,
  });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function useCreateTvDisplay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; unit_id: string; unit_code?: string | null }) => {
      const baseSlug = slugify(`${input.unit_code || input.unit_id.slice(0, 6)}-${input.name}`);
      const { data, error } = await supabase
        .from("tv_displays" as any)
        .insert({ name: input.name, unit_id: input.unit_id, slug: `${baseSlug}-${Date.now().toString(36)}` })
        .select()
        .single();
      if (error) throw error;
      const display = data as any;
      await supabase.rpc("seed_default_tv_cards" as any, { _display_id: display.id });
      return display as TvDisplay;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tv-displays"] }),
  });
}

export function useUpdateTvDisplay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Pick<TvDisplay, "name" | "active" | "slide_duration_seconds">> }) => {
      const { error } = await supabase.from("tv_displays" as any).update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tv-displays"] }),
  });
}

export function useDeleteTvDisplay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tv_displays" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tv-displays"] }),
  });
}

export function useRegenerateTvToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("regenerate_tv_display_token" as any, { _display_id: id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tv-displays"] }),
  });
}

export function useUpsertTvCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      display_id: string;
      card_type: string;
      enabled?: boolean;
      ordem?: number;
      config?: Record<string, unknown>;
      id?: string;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from("tv_display_cards" as any)
          .update({
            enabled: input.enabled,
            ordem: input.ordem,
            config: input.config ?? {},
          })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tv_display_cards" as any).insert({
          display_id: input.display_id,
          card_type: input.card_type,
          enabled: input.enabled ?? true,
          ordem: input.ordem ?? 99,
          config: input.config ?? {},
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tv-display-cards", vars.display_id] }),
  });
}
