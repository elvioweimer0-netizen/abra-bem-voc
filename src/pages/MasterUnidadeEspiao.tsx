import { useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function MasterUnidadeEspiao() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const espiao = params.get("modo") === "espiao";

  useEffect(() => {
    if (espiao && user && id) {
      supabase.from("master_spy_log").insert({
        master_user_id: user.id,
        target_unit_id: id,
        action_taken: "view_unit_panel",
      });
    }
  }, [espiao, user, id]);

  return (
    <div className="space-y-4">
      {espiao && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-warning" />
            <span className="font-medium">Modo espião ativo.</span>
            <span className="text-muted-foreground">Você está vendo o painel desta unidade. Suas ações ficam logadas.</span>
          </CardContent>
        </Card>
      )}
      <Card className="rounded-xl">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Visualização da unidade {id} — em desenvolvimento. Em breve renderiza o PainelGerente desta loja.
        </CardContent>
      </Card>
    </div>
  );
}
