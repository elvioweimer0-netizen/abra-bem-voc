import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PainelGerente from "@/pages/PainelGerente";

export default function MasterUnidadeEspiao() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const espiao = params.get("modo") === "espiao";
  const [unitName, setUnitName] = useState<string>("");
  const [gerenteName, setGerenteName] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    if (espiao && user) {
      supabase.from("master_spy_log").insert({
        master_user_id: user.id,
        target_unit_id: id,
        action_taken: "view_unit_panel",
      });
    }
    (async () => {
      const { data: unit } = await (supabase as any).from("units").select("name").eq("id", id).maybeSingle();
      if (unit) setUnitName(unit.name);
      const { data: ger } = await (supabase as any)
        .from("profiles")
        .select("nome")
        .eq("unit_id", id)
        .in("cargo", ["gerente_loja", "gerente"])
        .limit(1)
        .maybeSingle();
      if (ger) setGerenteName(ger.nome);
    })();
  }, [espiao, user, id]);

  if (!id) return null;

  return (
    <div className="space-y-4">
      <Card className="border-warning bg-warning/10">
        <CardContent className="p-3 flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-warning shrink-0" />
          <div>
            <span className="font-medium">
              Você está vendo como gerente {gerenteName || "—"} ({unitName || "unidade"}).
            </span>{" "}
            <span className="text-muted-foreground">Modo espião — ações ficam logadas.</span>
          </div>
        </CardContent>
      </Card>
      <PainelGerente unitOverride={id} gerenteName={gerenteName} />
    </div>
  );
}
