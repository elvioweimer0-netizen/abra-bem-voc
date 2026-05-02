import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function PerfilTreinamentos() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["training-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: comps } = await (supabase as any)
        .from("training_completions")
        .select("module_id, score, completed_at, training_modules(title, category)")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      const { data: attempts } = await (supabase as any)
        .from("training_attempts")
        .select("module_id, score, attempted_at, training_modules(title, category)")
        .eq("user_id", user!.id)
        .order("attempted_at", { ascending: false });
      return { comps: comps ?? [], attempts: attempts ?? [] };
    },
  });

  return (
    <div className="container max-w-3xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Meus treinamentos</h1>
          <p className="text-sm text-muted-foreground">Histórico de módulos concluídos e tentativas.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Concluídos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (data?.comps ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum módulo concluído ainda. <Link to="/treinamento" className="underline">Ver módulos</Link></p>
          ) : (
            <ul className="divide-y divide-border">
              {data!.comps.map((c: any) => (
                <li key={c.module_id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{c.training_modules?.title ?? "Módulo"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.completed_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge>{Number(c.score).toFixed(0)}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tentativas recentes</CardTitle></CardHeader>
        <CardContent>
          {(data?.attempts ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem tentativas registradas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data!.attempts.slice(0, 20).map((a: any, i: number) => (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm">{a.training_modules?.title ?? "Módulo"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.attempted_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <Badge variant={Number(a.score) >= 70 ? "default" : "secondary"}>{Number(a.score).toFixed(0)}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" asChild><Link to="/treinamento">Ver módulos</Link></Button>
      </div>
    </div>
  );
}
