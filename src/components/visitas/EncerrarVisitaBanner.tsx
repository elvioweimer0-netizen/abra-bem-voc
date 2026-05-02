import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVisitaAtiva } from "@/hooks/useVisitaAtiva";

const db = supabase as any;

export function EncerrarVisitaBanner() {
  const { visita, refresh } = useVisitaAtiva();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  if (!visita) return null;

  const isOnChecklist = location.pathname.startsWith("/checklist-diario");

  const encerrar = async () => {
    setLoading(true);
    const { error } = await db
      .from("visit_check_ins")
      .update({ check_out_at: new Date().toISOString() })
      .eq("id", visita.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao encerrar visita", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Visita encerrada", description: "Obrigado pelo registro." });
    await refresh();
    navigate("/historico-visitas");
  };

  return (
    <div className="sticky top-0 z-30 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <span className="truncate">
          🟢 Visita em andamento — <strong>{visita.unit?.name || "Unidade"}</strong>
        </span>
        <div className="flex shrink-0 gap-2">
          {!isOnChecklist && visita.completion_id && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/checklist-diario?completion=${visita.completion_id}&visita=${visita.id}`)}>
              Abrir checklist
            </Button>
          )}
          <Button size="sm" onClick={encerrar} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Encerrar visita
          </Button>
        </div>
      </div>
    </div>
  );
}
