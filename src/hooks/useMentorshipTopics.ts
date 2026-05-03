import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MentorshipTopic {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  ordem: number;
  active: boolean;
}

export function useMentorshipTopics() {
  return useQuery({
    queryKey: ["mentorship-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_topics")
        .select("*")
        .eq("active", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as MentorshipTopic[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
