import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MentorshipRequest {
  id: string;
  requester_user_id: string;
  mentor_user_id: string;
  topic_id: string;
  message: string;
  status: "aberto" | "aceito" | "recusado" | "concluido";
  mentor_response: string | null;
  created_at: string;
  responded_at: string | null;
  topic?: { name: string; icon: string | null } | null;
  other?: { nome: string; foto_url: string | null; cargo_titulo: string | null } | null;
}

async function loadAttachments(rows: any[], otherKey: "mentor_user_id" | "requester_user_id") {
  if (!rows.length) return rows;
  const topicIds = [...new Set(rows.map((r) => r.topic_id))];
  const userIds = [...new Set(rows.map((r) => r[otherKey]))];
  const [{ data: topics }, { data: profiles }] = await Promise.all([
    supabase.from("mentorship_topics").select("id, name, icon").in("id", topicIds),
    supabase.from("profiles").select("user_id, nome, foto_url, cargo_titulo").in("user_id", userIds),
  ]);
  const topicMap = new Map((topics ?? []).map((t) => [t.id, t]));
  const userMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return rows.map((r) => ({
    ...r,
    topic: topicMap.get(r.topic_id) ?? null,
    other: userMap.get(r[otherKey]) ?? null,
  }));
}

export function useMyMentorshipsAsMentor() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-mentorships", "mentor", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq("mentor_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (await loadAttachments(data ?? [], "requester_user_id")) as MentorshipRequest[];
    },
  });
}

export function useMyMentorshipsAsRequester() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-mentorships", "requester", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq("requester_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (await loadAttachments(data ?? [], "mentor_user_id")) as MentorshipRequest[];
    },
  });
}
