import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type SemaforoData = {
  unit_id: string;
  unit_name: string;
  unit_code: string | null;
  total_items: number;
  done_items: number;
  pct: number | null;
};

function colorFor(pct: number | null) {
  if (pct === null) return { bg: "bg-muted", text: "text-muted-foreground", label: "Sem checklist" };
  if (pct >= 100) return { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", label: "Completo" };
  if (pct >= 50) return { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-600 dark:text-amber-400", label: "Em andamento" };
  return { bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-600 dark:text-rose-400", label: "Atrasado" };
}

export function CardSemaforoUnidade({ data }: { data: SemaforoData }) {
  const c = colorFor(data.pct);
  return (
    <Card className={`border ${c.bg}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{data.unit_code}</p>
            <h3 className="text-base font-bold text-foreground">{data.unit_name}</h3>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.text}`}>{c.label}</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">{data.done_items} de {data.total_items} itens</span>
          <span className={`text-lg font-bold ${c.text}`}>{data.pct === null ? "—" : `${data.pct}%`}</span>
        </div>
        <Progress value={data.pct ?? 0} className="mt-2 h-2 bg-card" />
        <Link
          to={`/painel-cobranca?unit=${data.unit_id}`}
          className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver detalhe <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
