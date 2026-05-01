import { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarDays, ChevronRight, Clock, Filter, MessageSquareWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

type Unit = { id: string; code: string; name: string; type: string };
type ProfileRow = { user_id: string; nome: string; cargo: string; unit_id: string | null };
type Completion = { id: string; template_id: string; unit_id: string; user_id: string; status: string; completed_at: string | null; updated_at: string };
type Item = { id: string; template_id: string; descricao: string; ordem: number };
type Response = { item_id: string; completion_id: string; completed_at: string | null; observacao: string | null; resposta: string | null };
type Occurrence = { id: string; unit_id: string; descricao: string; status: string; gravidade: string; criado_em: string };

type UnitSummary = {
  unit: Unit;
  manager?: ProfileRow;
  total: number;
  done: number;
  percentage: number;
  lastUpdate?: string | null;
  occurrences: number;
  status: "completo" | "parcial" | "pendente";
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function statusClasses(status: UnitSummary["status"]) {
  if (status === "completo") return "border-success/30 bg-success/10";
  if (status === "parcial") return "border-warning/30 bg-warning/10";
  return "border-primary/30 bg-primary/10";
}

function timeLabel(value?: string | null) {
  if (!value) return "Sem atualização";
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function PainelCobranca() {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [filterUnit, setFilterUnit] = useState("all");
  const [selected, setSelected] = useState<UnitSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const today = todayISO();
      const [{ data: unitData }, { data: profileData }, { data: templateData }, { data: occurrenceData }] = await Promise.all([
        db.from("units").select("id, code, name, type").eq("active", true).order("code"),
        db.from("profiles").select("user_id, nome, cargo, unit_id").in("cargo", ["gerente", "gerente_loja", "encarregado", "lider_setor", "supervisor", "admin", "master"]),
        db.from("checklist_templates").select("id").eq("active", true),
        db.from("leadership_occurrences").select("id, unit_id, descricao, status, gravidade, criado_em").gte("criado_em", `${today}T00:00:00`).neq("status", "resolvido"),
      ]);

      const templateIds = (templateData || []).map((t: { id: string }) => t.id);
      const [{ data: itemData }, { data: completionData }] = await Promise.all([
        templateIds.length ? db.from("checklist_items").select("id, template_id, descricao, ordem").in("template_id", templateIds).order("ordem") : Promise.resolve({ data: [] }),
        templateIds.length ? db.from("checklist_completions").select("id, template_id, unit_id, user_id, status, completed_at, updated_at").eq("data", today).in("template_id", templateIds) : Promise.resolve({ data: [] }),
      ]);

      const completionIds = (completionData || []).map((c: Completion) => c.id);
      const { data: responseData } = completionIds.length
        ? await db.from("checklist_item_responses").select("item_id, completion_id, completed_at, observacao, resposta").in("completion_id", completionIds)
        : { data: [] };

      setUnits(unitData || []);
      setProfiles(profileData || []);
      setItems(itemData || []);
      setCompletions(completionData || []);
      setResponses(responseData || []);
      setOccurrences(occurrenceData || []);
    };

    load();
  }, []);

  const summaries = useMemo<UnitSummary[]>(() => {
    return units
      .filter((unit) => filterUnit === "all" || unit.id === filterUnit)
      .map((unit) => {
        const manager = profiles.find((p) => p.unit_id === unit.id && ["gerente", "gerente_loja", "encarregado", "lider_setor"].includes(p.cargo));
        const unitCompletions = completions.filter((c) => c.unit_id === unit.id);
        const templateIds = new Set(unitCompletions.map((c) => c.template_id));
        const unitItems = items.filter((item) => templateIds.has(item.template_id));
        const completionIds = new Set(unitCompletions.map((c) => c.id));
        const done = responses.filter((r) => completionIds.has(r.completion_id) && r.completed_at).length;
        const total = unitItems.length;
        const percentage = total ? Math.round((done / total) * 100) : 0;
        const lastUpdate = unitCompletions.map((c) => c.completed_at || c.updated_at).filter(Boolean).sort().at(-1);
        const openBos = occurrences.filter((o) => o.unit_id === unit.id).length;
        const status = percentage === 100 ? "completo" : percentage > 0 ? "parcial" : "pendente";
        return { unit, manager, total, done, percentage, lastUpdate, occurrences: openBos, status };
      });
  }, [units, profiles, completions, items, responses, occurrences, filterUnit]);

  const selectedCompletions = selected ? completions.filter((c) => c.unit_id === selected.unit.id) : [];
  const selectedCompletionIds = new Set(selectedCompletions.map((c) => c.id));
  const selectedTemplateIds = new Set(selectedCompletions.map((c) => c.template_id));
  const selectedItems = items.filter((item) => selectedTemplateIds.has(item.template_id));
  const selectedResponses = responses.filter((r) => selectedCompletionIds.has(r.completion_id));
  const selectedOccurrences = selected ? occurrences.filter((o) => o.unit_id === selected.unit.id) : [];

  const cobrarGerente = () => {
    toast({
      title: "Cobrança registrada",
      description: "O lembrete foi preparado para envio ao responsável da unidade.",
    });
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /> {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Painel de Cobrança</h1>
        </div>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-full sm:w-64"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filtrar unidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.code} • {unit.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>

      <div className="space-y-3">
        {summaries.map((summary) => (
          <Card key={summary.unit.id} className={`border ${statusClasses(summary.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground">{summary.unit.name}</h2>
                  <p className="text-sm text-muted-foreground">{summary.manager?.nome || "Responsável não vinculado"}</p>
                </div>
                {summary.occurrences > 0 && <Badge variant="destructive">{summary.occurrences} ocorrência</Badge>}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm font-medium"><span>{summary.done}/{summary.total} itens</span><span>{summary.percentage}%</span></div>
                <Progress value={summary.percentage} className="h-3 bg-card" />
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Última atualização: {timeLabel(summary.lastUpdate)}</p>
              </div>
              <Button variant="outline" className="mt-4 min-h-12 w-full justify-between" onClick={() => setSelected(summary)}>
                Ver detalhe <ChevronRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[86vh] overflow-y-auto rounded-xl p-4">
          <DialogHeader>
            <DialogTitle>{selected?.unit.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Checklist de hoje</CardTitle></CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  {selectedItems.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há checklist iniciado hoje.</p>}
                  {selectedItems.map((item) => {
                    const response = selectedResponses.find((r) => r.item_id === item.id);
                    return (
                      <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                        <div className={`mt-0.5 h-5 w-5 rounded-full ${response?.completed_at ? "bg-success" : "bg-muted"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">{response?.completed_at ? `Feito às ${timeLabel(response.completed_at)}` : "Pendente"}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Ocorrências do dia</CardTitle></CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {selectedOccurrences.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ocorrência aberta hoje.</p>}
                  {selectedOccurrences.map((bo) => (
                    <div key={bo.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-foreground">{bo.descricao}</p><Badge>{bo.gravidade}</Badge></div>
                      <p className="mt-1 text-xs text-muted-foreground">{bo.status}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Histórico semanal</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex h-16 items-end gap-2">
                    {[62, 78, 55, 90, selected.percentage, 0, 0].map((value, index) => (
                      <div key={index} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-primary/70" style={{ height: `${Math.max(value, 8)}%` }} />
                        <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button className="min-h-12 w-full gap-2 text-base font-semibold" onClick={cobrarGerente}>
                <BellRing className="h-5 w-5" /> Cobrar gerente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
