import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string | null;
  action_link: string | null;
  priority: number;
  expires_at: string;
}

export function useRecommendations(limit = 3) {
  const { user } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("recommendations")
      .select("id,type,title,description,action_link,priority,expires_at")
      .eq("target_user_id", user.id)
      .is("dismissed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("priority", { ascending: false })
      .limit(limit);
    setItems(data || []);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => { load(); }, [load]);

  const dismiss = useCallback(
    async (id: string) => {
      setItems((p) => p.filter((x) => x.id !== id));
      await (supabase as any)
        .from("recommendations")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", id);
    },
    [],
  );

  return { items, loading, reload: load, dismiss };
}
