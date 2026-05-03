import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMyMilestoneToday() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-milestone-today", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("milestone_celebrations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("milestone_date", today)
        .eq("post_visible", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
