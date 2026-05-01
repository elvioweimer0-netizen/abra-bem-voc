import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const db = supabase as any;

type Top = { destinatario_id: string; nome: string; total: number };

export function TopCuriosMes() {
  const [list, setList] = useState<Top[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data } = await db
        .from("praises")
        .select("destinatario_id, destinatario:team_members!praises_destinatario_id_fkey(nome)")
        .eq("publico", true)
        .gte("criado_em", start.toISOString());
      const counts = new Map<string, { nome: string; total: number }>();
      (data || []).forEach((row: any) => {
        const key = row.destinatario_id;
        const nome = row.destinatario?.nome || "—";
        const cur = counts.get(key) || { nome, total: 0 };
        cur.total += 1;
        counts.set(key, cur);
      });
      const top = Array.from(counts.entries())
        .map(([destinatario_id, v]) => ({ destinatario_id, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setList(top);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || list.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Trophy className="h-5 w-5 text-amber-500" /> Top Curiós do Mês
          </h3>
          <Link to="/curio-de-ouro" className="text-xs font-medium text-primary hover:underline">Ver mural</Link>
        </div>
        <ol className="space-y-2">
          {list.map((t, i) => (
            <li key={t.destinatario_id} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <span className="truncate text-sm font-medium text-foreground">{t.nome}</span>
              </div>
              <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t.total} elogio{t.total > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
