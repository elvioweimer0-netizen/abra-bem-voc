import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationGroup = {
  user_id: string;
  grouping_key: string;
  type: string;
  sample_title: string;
  sample_body: string;
  sample_payload: Record<string, unknown>;
  unit_id: string | null;
  event_count: number;
  latest_at: string;
  earliest_at: string;
  unread_count: number;
};

export type NotificationEvent = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  created_at: string;
  sent_at: string | null;
  grouping_key: string | null;
};

const WINDOW_MS = 4 * 60 * 60 * 1000;

function fallbackKey(type: string, payload: any): string {
  const id =
    payload?.aviso_id ||
    payload?.occurrence_id ||
    payload?.goal_id ||
    payload?.story_id ||
    payload?.meeting_id ||
    payload?.journey_id ||
    payload?.comment_id ||
    "";
  return `${id}:${type}`;
}

export function useNotificationGroups() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notification-groups", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NotificationGroup[]> => {
      if (!user) return [];
      // Try view first
      const { data: vData, error: vErr } = await (supabase as any)
        .from("notification_groups")
        .select("*")
        .eq("user_id", user.id)
        .order("latest_at", { ascending: false })
        .limit(50);
      if (!vErr && vData) return vData as NotificationGroup[];

      // Fallback: agrupar client-side
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data } = await supabase
        .from("notification_events")
        .select("*")
        .eq("recipient_user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      const map = new Map<string, NotificationGroup>();
      (data ?? []).forEach((ev: any) => {
        const key = ev.grouping_key || fallbackKey(ev.type, ev.payload);
        const cur = map.get(key);
        if (!cur) {
          map.set(key, {
            user_id: user.id,
            grouping_key: key,
            type: ev.type,
            sample_title: ev.title,
            sample_body: ev.body,
            sample_payload: ev.payload || {},
            unit_id: ev.unit_id,
            event_count: 1,
            latest_at: ev.created_at,
            earliest_at: ev.created_at,
            unread_count: ev.sent_at ? 0 : 1,
          });
        } else {
          cur.event_count += 1;
          if (!ev.sent_at) cur.unread_count += 1;
          if (ev.created_at < cur.earliest_at) cur.earliest_at = ev.created_at;
        }
      });
      return Array.from(map.values()).sort((a, b) => (a.latest_at < b.latest_at ? 1 : -1));
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-events-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_events", filter: `recipient_user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notification-groups", user.id] });
          qc.invalidateQueries({ queryKey: ["notification-events"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const totalUnread = useMemo(
    () => (query.data ?? []).reduce((acc, g) => acc + g.unread_count, 0),
    [query.data],
  );

  return { groups: query.data ?? [], isLoading: query.isLoading, totalUnread };
}

export function useNotificationEvents(groupingKey: string | null, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notification-events", user?.id, groupingKey],
    enabled: !!user && !!groupingKey && enabled,
    queryFn: async (): Promise<NotificationEvent[]> => {
      if (!user || !groupingKey) return [];
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data } = await (supabase as any)
        .from("notification_events")
        .select("id,type,title,body,payload,created_at,sent_at,grouping_key")
        .eq("recipient_user_id", user.id)
        .eq("grouping_key", groupingKey)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as unknown as NotificationEvent[];
    },
  });
}
