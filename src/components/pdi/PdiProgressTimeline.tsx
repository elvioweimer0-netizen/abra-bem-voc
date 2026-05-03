import { useGoalUpdates, useProfilesByIds } from "@/hooks/usePdi";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

export function PdiProgressTimeline({ goalId }: { goalId: string }) {
  const { data: updates, isLoading } = useGoalUpdates(goalId);
  const authorIds = useMemo(
    () => Array.from(new Set((updates ?? []).map((u) => u.autor_user_id))),
    [updates]
  );
  const { data: authors } = useProfilesByIds(authorIds);
  const nameMap = new Map((authors ?? []).map((a: any) => [a.user_id, a.nome]));

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!updates || updates.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhuma atualização ainda.</p>;

  return (
    <ol className="space-y-3">
      {updates.map((u) => (
        <li key={u.id} className="border-l-2 border-primary/40 pl-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{nameMap.get(u.autor_user_id) ?? "Usuário"}</span>
            <span>{format(parseISO(u.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
          {u.valor_atual != null && (
            <p className="text-xs font-semibold text-primary">Valor: {u.valor_atual}</p>
          )}
          <p className="mt-1 text-sm">{u.observacao}</p>
        </li>
      ))}
    </ol>
  );
}
