import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ManagerTask = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  unit_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "aberto" | "feito" | "arquivado";
  completed_at: string | null;
  created_at: string;
};

export function useMyManagerTasks() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["manager-tasks", "to-me", user?.id],
    queryFn: async (): Promise<ManagerTask[]> => {
      const { data, error } = await (supabase as any)
        .from("manager_to_supervisor_tasks")
        .select("*")
        .eq("to_user_id", user!.id)
        .order("status")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ManagerTask[];
    },
  });
}

export function useSentManagerTasks() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["manager-tasks", "from-me", user?.id],
    queryFn: async (): Promise<ManagerTask[]> => {
      const { data, error } = await (supabase as any)
        .from("manager_to_supervisor_tasks")
        .select("*")
        .eq("from_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ManagerTask[];
    },
  });
}

export function useMarkTaskDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("manager_to_supervisor_tasks")
        .update({ status: "feito", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa concluída");
      qc.invalidateQueries({ queryKey: ["manager-tasks"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
}

export function useCreateManagerTask() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (input: { to_user_id: string; title: string; description?: string; due_date?: string }) => {
      const { error } = await (supabase as any)
        .from("manager_to_supervisor_tasks")
        .insert({
          from_user_id: user!.id,
          to_user_id: input.to_user_id,
          unit_id: (profile as any)?.unit_id ?? null,
          title: input.title,
          description: input.description ?? null,
          due_date: input.due_date ?? null,
          status: "aberto",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa enviada");
      qc.invalidateQueries({ queryKey: ["manager-tasks"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
}
