import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, MessageSquare, X } from "lucide-react";
import type { Aviso } from "@/types/database";
import { AvisoReadButton } from "@/components/AvisoReadButton";
import { AvisoReactionBar } from "@/components/avisos/AvisoReactionBar";
import { useAvisoEngagementCounts } from "@/hooks/useAvisoEngagement";

export function AvisosBanner() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("avisos")
      .select("*")
      .eq("ativo", true)
      .eq("urgente", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAvisos((data as Aviso[]) || []));
  }, []);

  const visible = avisos.filter((a) => !dismissed.has(a.id));
  const { data: counts } = useAvisoEngagementCounts(visible.map((a) => a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((aviso) => (
        <div
          key={aviso.id}
          className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">{aviso.titulo}</p>
            <p className="text-xs text-destructive/80 mt-0.5">{aviso.conteudo}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AvisoReadButton avisoId={aviso.id} />
              <Link
                to={`/avisos/${aviso.id}`}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-background/50 px-2 py-1 text-xs font-medium text-destructive hover:bg-background"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Comentários ({counts?.[aviso.id]?.comments ?? 0})
              </Link>
            </div>
            <div className="mt-2"><AvisoReactionBar avisoId={aviso.id} compact /></div>
          </div>
          <button
            onClick={() => setDismissed((s) => new Set(s).add(aviso.id))}
            className="text-destructive/60 hover:text-destructive shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
