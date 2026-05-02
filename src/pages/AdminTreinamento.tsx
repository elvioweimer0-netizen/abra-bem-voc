import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus } from "lucide-react";
import { ModuleForm, type ModuleFormValue } from "@/components/treinamento/admin/ModuleForm";
import { QuizEditor } from "@/components/treinamento/admin/QuizEditor";
import { categoryLabels } from "@/components/treinamento/ModuleCard";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminTreinamento() {
  const isRh = useIsRhAdmin();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ModuleFormValue | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin-training-modules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("training_modules").select("*").order("ordem");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isRh,
  });

  if (!isRh) return <Navigate to="/" replace />;

  async function toggleActive(id: string, active: boolean) {
    const { error } = await (supabase as any).from("training_modules").update({ active }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Atualizado"); refetch(); qc.invalidateQueries({ queryKey: ["training-modules"] }); }
  }

  return (
    <div className="container max-w-5xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Treinamentos</h1>
          <p className="text-sm text-muted-foreground">Gerenciar cápsulas e quizzes.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo módulo</Button>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((m: any) => (
          <Card key={m.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex-1">
                <CardTitle className="text-base">{m.title}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{categoryLabels[m.category] ?? m.category}</Badge>
                  <span>ordem {m.ordem}</span>
                  <span>· {m.duration_seconds}s</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><Switch checked={m.active} onCheckedChange={(c) => toggleActive(m.id, c)} /><span className="text-xs">Ativo</span></div>
                <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...m }); setOpen(true); }}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>
                <Button size="sm" variant={expanded === m.id ? "default" : "outline"} onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                  {expanded === m.id ? "Fechar quiz" : "Editar quiz"}
                </Button>
              </div>
            </CardHeader>
            {expanded === m.id && (
              <CardContent><QuizEditor moduleId={m.id} /></CardContent>
            )}
          </Card>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado.</p>}
      </div>

      <ModuleForm open={open} onOpenChange={setOpen} initial={editing} onSaved={() => { refetch(); qc.invalidateQueries({ queryKey: ["training-modules"] }); }} />
    </div>
  );
}
