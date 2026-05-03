import { useQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type TvCardType =
  | "aniversariantes"
  | "curio_ouro"
  | "stories_unidade"
  | "top_pendencias"
  | "compromissos_semana"
  | "historias_curio"
  | "avisos_importantes"
  | "conquistas_equipe"
  | "pilula_cultura";

export interface TvCard {
  type: TvCardType;
  config: Record<string, unknown>;
  data: any;
}

export interface TvFeedPayload {
  display: {
    id: string;
    name: string;
    unit_id: string;
    unit_name: string | null;
    slide_duration_seconds: number;
  };
  cards: TvCard[];
  generated_at: string;
}

async function fetchTvFeed(token: string): Promise<TvFeedPayload> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tv-feed?token=${encodeURIComponent(token)}`, {
    headers: { apikey: ANON_KEY },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function useTvFeed(token: string | undefined) {
  return useQuery({
    queryKey: ["tv-feed", token],
    queryFn: () => fetchTvFeed(token!),
    enabled: !!token,
    staleTime: 55_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
