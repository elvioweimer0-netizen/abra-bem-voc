import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCanEditCulture } from "@/hooks/useCanEditCulture";
import { useCulturePillsList, useCulturePillUpsert, useCultureValues, type CulturePill } from "@/hooks/useCulturePills";
import { CulturePillCard } from "@/components/culture/CulturePillCard";
import { CulturePillFormModal } from "@/components/culture/CulturePillFormModal";
import { CultureCalendar } from "@/components/culture/CultureCalendar";
import { CultureValueBadge } from "@/components/culture/CultureValueBadge";
import { toast } from "sonner";

const SEED_PACK = [
  { title: "Acolher é abrir a porta", content: "Cada cliente que entra é alguém esperando ser bem recebido. Sorria, olhe nos olhos, faça sentir em casa.", code: "acolhimento" },
  { title: "Capricho que se nota", content: "Produto bem exposto, gôndola limpa, etiqueta no lugar. Qualidade aparece nos pequenos detalhes.", code: "qualidade" },
  { title: "Combinou, cumpriu", content: "Cumprir o que foi prometido — pro colega, pro cliente, pra empresa. É assim que se constrói confiança.", code: "compromisso" },
  { title: "Família que se cuida", content: "Quando um precisa, todos chegam junto. Aqui ninguém carrega peso sozinho.", code: "familia_curio" },
  { title: "Bom dia que transforma", content: "Um cumprimento sincero muda o dia da pessoa. Comece sempre pelo acolhimento.", code: "acolhimento" },
  { title: "Refazer com orgulho", content: "Se não ficou bom, refaz. Qualidade não admite atalho.", code: "qualidade" },
  { title: "Palavra dada vale ouro", content: "Marcou horário, entregou prazo, prometeu retorno — cumpra. Compromisso é currículo silencioso.", code: "compromisso" },
];

export default function AdminCultura() {
  const canEdit = useCanEditCulture();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CulturePill> | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const { data: values = [] } = useCultureValues();
  const { data: list } = useCulturePillsList(undefined, 0, 50);
  const upsert = useCulturePillUpsert();

  if (!canEdit) return <Navigate to="/cultura" replace />;

  const openNew = (date?: string) => {
    setEditing(null);
    setDefaultDate(date);
    setOpen(true);
  };

  const openEdit = (p: CulturePill) => {
    setEditing(p);
    setDefaultDate(p.display_date);
    setOpen(true);
  };

  const importSeed = async () => {
    if (!values.length) {
      toast.error("Cadastre os valores primeiro.");
      return;
    }
    const today = new Date();
    let inserted = 0;
    for (let i = 0; i < SEED_PACK.length; i++) {
      const pack = SEED_PACK[i];
      const value = values.find((v) => v.code === pack.code);
      if (!value) continue;
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      try {
        await upsert.mutateAsync({
          title: pack.title,
          content: pack.content,
          value_id: value.id,
          display_date: iso,
          active: true,
        });
        inserted++;
      } catch (e) { /* unique conflict — skip */ }
    }
    toast.success(`${inserted} pílulas importadas.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin · Cultura</h1>
          <p className="text-sm text-muted-foreground">Programe pílulas diárias por valor.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importSeed} className="gap-1">
            <Sparkles className="h-4 w-4" /> Importar pacote inicial
          </Button>
          <Button onClick={() => openNew()} className="gap-1">
            <Plus className="h-4 w-4" /> Nova pílula
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CultureCalendar onPick={(date, existing) => (existing ? openEdit(existing) : openNew(date))} />
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-3">
          {list?.pills.map((p) => (
            <div key={p.id} onClick={() => openEdit(p)} className="cursor-pointer">
              <CulturePillCard pill={p} />
              <p className="mt-1 text-xs text-muted-foreground">{p.display_date}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="values" className="mt-4">
          <Card>
            <CardContent className="space-y-2 p-5">
              {values.map((v) => (
                <div key={v.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <CultureValueBadge value={v} size="md" />
                  <span className="text-xs text-muted-foreground">{v.description}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CulturePillFormModal open={open} onOpenChange={setOpen} initial={editing} defaultDate={defaultDate} />
    </div>
  );
}
