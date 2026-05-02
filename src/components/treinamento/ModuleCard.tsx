import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { ModuleWithStatus } from "@/hooks/useTrainingModules";

const categoryLabels: Record<string, string> = {
  atendimento: "Atendimento",
  flv: "FLV",
  padaria: "Padaria",
  acougue: "Açougue",
  seguranca_alimentar: "Segurança Alimentar",
  codigo_etica: "Código de Ética",
  outros: "Outros",
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ModuleCard({ m }: { m: ModuleWithStatus }) {
  return (
    <Link to={`/treinamento/${m.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {m.thumbnail_url ? (
            <img src={m.thumbnail_url} alt={m.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <PlayCircle className="h-12 w-12" />
            </div>
          )}
          <Badge className="absolute right-2 top-2" variant="secondary">{fmt(m.duration_seconds || 0)}</Badge>
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">{categoryLabels[m.category] ?? m.category}</Badge>
            {m.status === "concluido" && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {Number(m.last_score).toFixed(0)}%</span>
            )}
            {m.status === "reprovado" && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600"><XCircle className="h-3.5 w-3.5" /> {Number(m.last_score).toFixed(0)}%</span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold">{m.title}</h3>
          {m.description && <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

export { categoryLabels };
