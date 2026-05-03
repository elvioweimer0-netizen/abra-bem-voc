import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Award, ListChecks, Sparkles, Clock, ExternalLink, Pencil, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { type HuddleReport, useSetHuddleAgenda, type AgendaTopico } from "@/hooks/useDailyHuddle";

const tipoMeta: Record<AgendaTopico["tipo"], { icon: any; cls: string; label: string }> = {
  alerta: { icon: AlertTriangle, cls: "bg-destructive/10 text-destructive border-destructive/30", label: "Alerta" },
  decisao: { icon: ListChecks, cls: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300", label: "Decisão" },
  reconhecimento: { icon: Award, cls: "bg-success/10 text-success border-success/30", label: "Reconhecer" },
};

function topicosToMarkdown(topicos: AgendaTopico[], selected: Set<number>): string {
  return topicos
    .map((t, i) => (selected.has(i) ? `- [${tipoMeta[t.tipo].label}] ${t.titulo} — ${t.acao_sugerida}` : null))
    .filter(Boolean)
    .join("\n");
}

type Props = { unitId: string; report: HuddleReport | null };

export function SuggestedAgendaCard({ unitId, report }: Props) {
  const suggested = report?.suggested_agenda ?? null;
  const [selected, setSelected] = useState<Set<number>>(() => new Set((suggested?.topicos ?? []).map((_, i) => i)));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(report?.final_agenda ?? "");
  const setAgenda = useSetHuddleAgenda();

  const used = !!report?.agenda_used;
  const topicos = useMemo(() => suggested?.topicos ?? [], [suggested]);

  if (!suggested && !report?.final_agenda) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 opacity-60" />
          Curiozinho ainda não gerou pauta hoje (ou não há sinais novos).
        </CardContent>
      </Card>
    );
  }

  const toggle = (i: number) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
  };

  const usar = async () => {
    const md = topicosToMarkdown(topicos, selected);
    await setAgenda.mutateAsync({ unit_id: unitId, final_agenda: md, agenda_used: true });
  };

  const salvarEdit = async () => {
    await setAgenda.mutateAsync({ unit_id: unitId, final_agenda: draft, agenda_used: true });
    setEditing(false);
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {used ? "Pauta usada" : "Pauta sugerida pelo Curiozinho"}
          </CardTitle>
          {suggested && (
            <Badge variant="outline" className="gap-1 text-[11px]">
              <Clock className="w-3 h-3" /> ~{suggested.tempo_estimado_min} min
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!editing && topicos.length > 0 && (
          <ul className="space-y-2">
            {topicos.map((t, i) => {
              const meta = tipoMeta[t.tipo];
              const Icon = meta.icon;
              return (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  {!used && (
                    <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} className="mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`gap-1 text-[10px] ${meta.cls}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{t.fonte}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.acao_sugerida}</p>
                  </div>
                  <Button size="sm" variant="ghost" asChild className="shrink-0 h-7 px-2">
                    <Link to={t.deep_link}><ExternalLink className="w-3.5 h-3.5" /></Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {editing && (
          <Textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Edite a pauta livremente..." />
        )}

        {!editing && used && report?.final_agenda && (
          <pre className="text-xs whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-muted-foreground">{report.final_agenda}</pre>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          {!editing && !used && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setDraft(topicosToMarkdown(topicos, selected) || report?.final_agenda || ""); setEditing(true); }}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
              </Button>
              <Button size="sm" onClick={usar} disabled={selected.size === 0 || setAgenda.isPending}>
                <Check className="w-3.5 h-3.5 mr-1" /> Usar essa pauta
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button size="sm" onClick={salvarEdit} disabled={setAgenda.isPending}>Salvar pauta</Button>
            </>
          )}
          {!editing && used && (
            <Button size="sm" variant="outline" onClick={() => { setDraft(report?.final_agenda ?? ""); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar pauta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
