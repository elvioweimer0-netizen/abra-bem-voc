import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, MessageCircle, Coffee, Plus, FileWarning } from "lucide-react";
import { Link } from "react-router-dom";
import type { WhatsappSummaryItem, WhatsappSummaryPayload } from "@/hooks/useWhatsappSummary";

type Tone = "danger" | "success" | "warning" | "muted";

const TONE_CLASSES: Record<Tone, { card: string; title: string; badge: string }> = {
  danger: {
    card: "border-destructive/40 bg-destructive/5",
    title: "text-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
  },
  success: {
    card: "border-emerald-500/40 bg-emerald-500/5",
    title: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  warning: {
    card: "border-amber-500/40 bg-amber-500/5",
    title: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  muted: {
    card: "border-border bg-muted/30",
    title: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
};

function ItemRow({
  item,
  actions,
}: {
  item: WhatsappSummaryItem;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/60 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {item.timestamp ? <Badge variant="outline" className="font-mono">{item.timestamp}</Badge> : null}
        <span className="font-semibold text-foreground">{item.autor || "Desconhecido"}</span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-foreground">{item.texto}</p>
      {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  tone,
  items,
  actionsFor,
  emptyLabel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  items: WhatsappSummaryItem[];
  actionsFor?: (item: WhatsappSummaryItem) => React.ReactNode;
  emptyLabel: string;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <Card className={t.card}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-lg ${t.title}`}>
          <Icon className="h-5 w-5" />
          <span>{title}</span>
          <span className={`ml-auto text-sm rounded-full px-2 py-0.5 border ${t.badge}`}>{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>
        ) : (
          items.map((it, i) => (
            <ItemRow key={i} item={it} actions={actionsFor?.(it)} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function WhatsappSummaryCards({ summary, withActions = true }: { summary: WhatsappSummaryPayload; withActions?: boolean }) {
  const renderActions = (item: WhatsappSummaryItem) => {
    if (!withActions) return null;
    const draft = encodeURIComponent(`[${item.timestamp || ""}] ${item.autor}: ${item.texto}`.trim());
    return (
      <>
        <Button asChild size="sm" variant="outline">
          <Link to={`/avisos?new=1&draft=${draft}`}>
            <Plus className="mr-1 h-4 w-4" /> Criar aviso
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/ocorrencias?new=1&draft=${draft}`}>
            <FileWarning className="mr-1 h-4 w-4" /> Criar ocorrência
          </Link>
        </Button>
      </>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Section
        title="Ações"
        icon={AlertTriangle}
        tone="danger"
        items={summary.acoes}
        actionsFor={renderActions}
        emptyLabel="Nenhuma ação pendente identificada."
      />
      <Section
        title="Decisões"
        icon={CheckCircle2}
        tone="success"
        items={summary.decisoes}
        emptyLabel="Nenhuma decisão registrada."
      />
      <Section
        title="Reclamações"
        icon={MessageCircle}
        tone="warning"
        items={summary.reclamacoes}
        emptyLabel="Nenhuma reclamação no período."
      />
      <Section
        title="Menos relevantes"
        icon={Coffee}
        tone="muted"
        items={summary.menos_relevantes}
        emptyLabel="Nada registrado."
      />
    </div>
  );
}
