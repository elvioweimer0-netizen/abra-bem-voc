import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

export function useAccessibleUnits() {
  const { profile } = useAuth();
  const { isAdmin, isSupervisor } = useRole();

  return useQuery({
    queryKey: ["accessible-units", profile?.user_id, isAdmin, isSupervisor],
    enabled: !!profile,
    queryFn: async () => {
      const q = supabase.from("units").select("id, code, name, type").order("code");
      const { data, error } = await q;
      if (error) throw error;
      const all = data ?? [];
      if (isAdmin || isSupervisor) return all;
      const allowed = new Set<string>();
      if ((profile as any)?.unit_id) allowed.add((profile as any).unit_id);
      const perm = ((profile as any)?.permission_units ?? []) as string[];
      perm.forEach((id) => allowed.add(id));
      return all.filter((u) => allowed.has(u.id));
    },
  });
}
