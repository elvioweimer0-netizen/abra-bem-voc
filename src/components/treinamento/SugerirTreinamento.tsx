import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

/**
 * Mostra um banner sugerindo treinamento quando algum dos `motivos` da ocorrência
 * tiver um módulo associado em `occurrence_reason_modules`.
 */
export function SugerirTreinamento({ motivos }: { motivos: string[] }) {
  const [module, setModule] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!motivos?.length) return;
    let cancel = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("occurrence_reason_modules")
        .select("training_module_id, training_modules(id, title, active)")
        .in("reason_key", motivos);
      if (cancel) return;
      const match = (data ?? []).find((r: any) => r.training_modules?.active);
      if (match?.training_modules) setModule({ id: match.training_modules.id, title: match.training_modules.title });
    })();
    return () => { cancel = true; };
  }, [motivos?.join("|")]);

  if (!module) return null;

  return (
    <Alert>
      <GraduationCap className="h-4 w-4" />
      <AlertTitle>Veja como deve ser feito</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-3">
        <span>Treinamento relacionado: <strong>{module.title}</strong></span>
        <Button size="sm" asChild><Link to={`/treinamento/${module.id}`}>Assistir</Link></Button>
      </AlertDescription>
    </Alert>
  );
}
