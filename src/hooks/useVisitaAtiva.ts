import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export type VisitaAtiva = {
  id: string;
  unit_id: string;
  completion_id: string | null;
  check_in_at: string;
  unit?: { name: string; code: string } | null;
};

export function useVisitaAtiva() {
  const { user } = useAuth();
  const [visita, setVisita] = useState<VisitaAtiva | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setVisita(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await db
      .from("visit_check_ins")
      .select("id, unit_id, completion_id, check_in_at, unit:units(name, code)")
      .eq("user_id", user.id)
      .is("check_out_at", null)
      .order("check_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setVisita(data || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { visita, loading, refresh };
}
