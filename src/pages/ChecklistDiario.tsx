import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, CheckCircle2, Clock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

type Unit = { id: string; code: string; name: string; type: "loja" | "central" };
type Template = { id: string; name: string; unit_type: string; period: string; role_target: string };
type Item = { id: string; template_id: string; ordem: number; descricao: string; tipo_resposta: "sim_nao" | "texto" | "foto" | "escala"; requires_photo?: boolean };

const ESCALA_OPTIONS: { value: "alto" | "medio" | "baixo"; label: string; tone: string }[] = [
  { value: "alto", label: "Alto", tone: "bg-success text-success-foreground border-success" },
  { value: "medio", label: "Médio", tone: "bg-amber-500 text-white border-amber-500" },
  { value: "baixo", label: "Baixo", tone: "bg-destructive text-destructive-foreground border-destructive" },
];
type Completion = { id: string; template_id: string; status: string; completed_at: string | null };
type Response = { id?: string; item_id: string; resposta?: string | null; foto_url?: string | null; observacao?: string | null; completed_at?: string | null };

const periodLabels: Record<string, string> = {
  abertura: "Abertura",
  durante: "Durante o Dia",
  fechamento: "Fechamento",
  producao_dia: "Produção Dia",
  operacao_cd: "Operação CD",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function timeLabel(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChecklistDiario() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [unit, setUnit] = useState<Unit | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [completions, setCompletions] = useState<Record<string, Completion>>({});
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [activePeriod, setActivePeriod] = useState("abertura");
  const [saving, setSaving] = useState(false);
  const [donePulse, setDonePulse] = useState(false);

  const profileAny = profile as any;

  useEffect(() => {
    if (!profile || !user) return;

    const load = async () => {
      const unitId = profileAny.unit_id;
      let selectedUnit: Unit | null = null;

      if (unitId) {
        const { data } = await db.from("units").select("id, code, name, type").eq("id", unitId).maybeSingle();
        selectedUnit = data;
      }

      if (!selectedUnit) {
        const { data } = await db.from("units").select("id, code, name, type").eq("location", profile.unidade).maybeSingle();
        selectedUnit = data;
      }

      setUnit(selectedUnit);
      if (!selectedUnit) return;

      const unitType = selectedUnit.code === "CP" ? "cp" : selectedUnit.code === "CD" ? "cd" : "loja";
      const roleTarget = profile.cargo === "encarregado" || profile.cargo === "lider_setor" ? "encarregado" : "gerente";

      const { data: templateData } = await db
        .from("checklist_templates")
        .select("id, name, unit_type, period, role_target")
        .eq("active", true)
        .in("unit_type", [unitType, "all"])
        .eq("role_target", roleTarget)
        .order("name");

      const loadedTemplates = templateData || [];
      setTemplates(loadedTemplates);
      setActivePeriod(loadedTemplates[0]?.period || "abertura");

      const templateIds = loadedTemplates.map((t: Template) => t.id);
      if (!templateIds.length) return;

      const { data: itemData } = await db.from("checklist_items").select("id, template_id, ordem, descricao, tipo_resposta, requires_photo").in("template_id", templateIds).order("ordem");
      const completionRes = await db.from("checklist_completions").select("id, template_id, status, completed_at").eq("user_id", user.id).eq("unit_id", selectedUnit.id).eq("data", todayISO()).in("template_id", templateIds);
      const completionData = completionRes.data;

      setItems(itemData || []);
      const completionMap = Object.fromEntries((completionData || []).map((c: Completion) => [c.template_id, c]));
      setCompletions(completionMap);

      const completionIds = (completionData || []).map((c: Completion) => c.id);
      if (completionIds.length) {
        const { data: responseData } = await db
          .from("checklist_item_responses")
          .select("id, item_id, resposta, foto_url, observacao, completed_at")
          .in("completion_id", completionIds);
        setResponses(Object.fromEntries((responseData || []).map((r: Response) => [r.item_id, r])));
      }
    };

    load();
  }, [profile, user]);

  const activeTemplate = templates.find((t) => t.period === activePeriod) || templates[0];
  const activeItems = useMemo(
    () => items.filter((item) => item.template_id === activeTemplate?.id).sort((a, b) => a.ordem - b.ordem),
    [items, activeTemplate?.id]
  );
  const completedCount = activeItems.filter((item) => responses[item.id]?.completed_at).length;
  const progress = activeItems.length ? Math.round((completedCount / activeItems.length) * 100) : 0;

  const markItem = (item: Item, checked: boolean) => {
    if (checked && item.requires_photo && !responses[item.id]?.foto_url) {
      toast({ title: "Foto obrigatória", description: "Anexe uma foto antes de marcar este item.", variant: "destructive" });
      return;
    }
    setResponses((current) => ({
      ...current,
      [item.id]: {
        ...current[item.id],
        item_id: item.id,
        resposta: checked ? "true" : "false",
        completed_at: checked ? new Date().toISOString() : null,
      },
    }));
  };

  const updateObservation = (item: Item, value: string) => {
    setResponses((current) => ({
      ...current,
      [item.id]: {
        ...current[item.id],
        item_id: item.id,
        resposta: value,
        observacao: value,
        completed_at: value.trim() ? current[item.id]?.completed_at || new Date().toISOString() : null,
      },
    }));
  };

  const uploadPhoto = async (item: Item, file?: File) => {
    if (!file || !user || !unit) return;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${unit.id}/${user.id}/${todayISO()}-${item.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("checklist-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast({ title: "Não foi possível anexar a foto", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = await supabase.storage.from("checklist-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = data?.signedUrl ?? path;
    setResponses((current) => ({
      ...current,
      [item.id]: {
        ...current[item.id],
        item_id: item.id,
        resposta: "true",
        foto_url: url,
        completed_at: item.requires_photo ? current[item.id]?.completed_at || new Date().toISOString() : current[item.id]?.completed_at ?? null,
      },
    }));
  };

  const setEscala = (item: Item, value: "alto" | "medio" | "baixo") => {
    setResponses((current) => ({
      ...current,
      [item.id]: {
        ...current[item.id],
        item_id: item.id,
        resposta: value,
        completed_at: new Date().toISOString(),
      },
    }));
  };
    if (!activeTemplate || !unit || !user) return;
    setSaving(true);

    const status = completedCount === 0 ? "pendente" : completedCount === activeItems.length ? "completo" : "parcial";
    const { data: completion, error: completionError } = await db
      .from("checklist_completions")
      .upsert({
        template_id: activeTemplate.id,
        user_id: user.id,
        unit_id: unit.id,
        data: todayISO(),
        status,
        completed_at: status === "completo" ? new Date().toISOString() : null,
      }, { onConflict: "template_id,user_id,unit_id,data" })
      .select("id, template_id, status, completed_at")
      .single();

    if (completionError) {
      setSaving(false);
      toast({ title: "Erro ao salvar checklist", description: completionError.message, variant: "destructive" });
      return;
    }

    const rows = activeItems
      .map((item) => responses[item.id])
      .filter(Boolean)
      .map((response) => ({ ...response, completion_id: completion.id }));

    if (rows.length) {
      const { error } = await db.from("checklist_item_responses").upsert(rows, { onConflict: "completion_id,item_id" });
      if (error) {
        setSaving(false);
        toast({ title: "Erro ao salvar respostas", description: error.message, variant: "destructive" });
        return;
      }
    }

    setCompletions((current) => ({ ...current, [activeTemplate.id]: completion }));
    setSaving(false);
    setDonePulse(status === "completo");
    setTimeout(() => setDonePulse(false), 1400);
    toast({ title: status === "completo" ? "Checklist completo" : "Checklist salvo", description: `${completedCount}/${activeItems.length} itens registrados.` });
  };

  if (!profile) return null;

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm">
        <p className="text-sm opacity-90">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
        <h1 className="mt-1 text-2xl font-bold">Meu Checklist do Dia</h1>
        <p className="mt-1 text-sm opacity-90">{profile.nome} • {unit?.name || profile.unidade}</p>
      </section>

      <Tabs value={activePeriod} onValueChange={setActivePeriod} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted p-1">
          {templates.map((template) => (
            <TabsTrigger key={template.id} value={template.period} className="min-h-11 text-xs data-[state=active]:bg-card data-[state=active]:text-primary">
              {periodLabels[template.period] || template.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map((template) => (
          <TabsContent key={template.id} value={template.period} className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Progresso da etapa</p>
                    <p className="text-sm text-muted-foreground">{completedCount} de {activeItems.length} itens cumpridos</p>
                  </div>
                  {donePulse && <CheckCircle2 className="h-8 w-8 animate-bounce text-success" />}
                </div>
                <Progress value={progress} className="mt-3 h-3" />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {activeItems.map((item) => {
                const response = responses[item.id];
                const checked = Boolean(response?.completed_at);
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox className="mt-1 h-8 w-8 rounded-lg" checked={checked} onCheckedChange={(value) => markItem(item, Boolean(value))} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-semibold leading-snug text-foreground">{item.descricao}</p>
                            {item.requires_photo && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Foto obrigatória</span>}
                          </div>
                          {checked && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-success"><Clock className="h-3.5 w-3.5" /> Marcado às {timeLabel(response?.completed_at)}</p>
                          )}
                          {item.tipo_resposta === "texto" && (
                            <Input className="mt-3" placeholder="Digite a observação" value={response?.observacao || ""} onChange={(event) => updateObservation(item, event.target.value)} />
                          )}
                          {(item.tipo_resposta === "foto" || item.requires_photo) && (
                            <div className="mt-3 space-y-2">
                              <input ref={(node) => (fileInputs.current[item.id] = node)} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => uploadPhoto(item, event.target.files?.[0])} />
                              {response?.foto_url && (
                                <img src={response.foto_url} alt="Preview" className="h-32 w-full rounded-lg border border-border object-cover" />
                              )}
                              <Button type="button" variant="outline" className="min-h-12 w-full justify-center gap-2" onClick={() => fileInputs.current[item.id]?.click()}>
                                <Camera className="h-5 w-5" /> {response?.foto_url ? "Trocar foto" : "Capturar foto"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button className="min-h-12 w-full gap-2 text-base font-semibold" onClick={savePeriod} disabled={saving || !activeItems.length}>
              {progress === 100 ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
