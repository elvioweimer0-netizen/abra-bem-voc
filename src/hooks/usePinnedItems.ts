import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PinnedItem = {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  active: boolean;
  ordem: number;
  created_at: string;
};

export function usePinnedItems() {
  return useQuery({
    queryKey: ["master-pinned-items"],
    queryFn: async (): Promise<PinnedItem[]> => {
      const { data, error } = await (supabase as any)
        .from("master_pinned_items")
        .select("*")
        .eq("active", true)
        .order("ordem")
        .limit(5);
      if (error) throw error;
      return (data ?? []) as PinnedItem[];
    },
  });
}
