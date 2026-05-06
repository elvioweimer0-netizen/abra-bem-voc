import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ListChecks } from "lucide-react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const db = supabase as any;

type Action = {
  id: string;
  meeting_id: string;
  descricao: string;
  responsavel: string | null;
  prazo: string | null;
  status: string;
  meeting?: { title: string; unit_id: string | null } | null;
};

type Filter = "minhas" | "unidade" | "todas";

export default function Tarefas() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<Filter>("todas");
  const [items, setItems] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await db
      .from("meeting_action_items")
      .select("id, meeting_id, descricao, responsavel, prazo, status, meeting:leadership_meetings(title, unit_id)")
      .neq("status", "concluido")
      .order("prazo", { ascending: true, nullsFirst: false })
      .limit(200);
    setItems((data as Action[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const myName = (profile?.nome || "").toLowerCase().trim();
    const myUnit = (profile as any)?.unit_id || null;
    return items.filter((it) => {
      if (filter === "minhas") return myName && (it.responsavel || "").toLowerCase().includes(myName);
      if (filter === "unidade") return myUnit && it.meeting?.unit_id === myUnit;
      return true;
    });
  }, [items, filter, profile]);

  const markDone = async (id: string) => {
    const { error } = await db.from("meeting_action_items").update({ status: "concluido" }).eq("id", id);
    if (error) return toast.error("Não consegui marcar: " + error.message);
    toast.success("Tarefa concluída!");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ListChecks className="w-6 h-6 text-primary" /> Tarefas das Reuniões</h1>
        <p className="text-sm text-muted-foreground mt-1">Ações geradas pela IA a partir das atas.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="minhas">Minhas</TabsTrigger>
          <TabsTrigger value="unidade">Da unidade</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : filtered.length === 0 ? (
        <Card className="card-shadow"><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma tarefa pendente neste filtro.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => {
            const days = it.prazo ? differenceInCalendarDays(parseISO(it.prazo), new Date()) : null;
            const tone = days === null ? "bg-muted text-muted-foreground" : days < 0 ? "bg-destructive/10 text-destructive border-destructive/30" : days <= 3 ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30";
            return (
              <Card key={it.id} className={`card-shadow border ${tone.split(" ").slice(2).join(" ")}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-medium text-sm text-foreground">{it.descricao}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {it.responsavel && <Badge variant="secondary" className="text-[10px]">👤 {it.responsavel}</Badge>}
                      {it.prazo && <Badge className={`text-[10px] ${tone}`}>{format(parseISO(it.prazo), "dd/MM", { locale: ptBR })} {days !== null && days < 0 ? `(${Math.abs(days)}d atrasada)` : days !== null ? `(em ${days}d)` : ""}</Badge>}
                      {it.meeting?.title && <span className="text-muted-foreground truncate max-w-[280px]">de "{it.meeting.title}"</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => markDone(it.id)} className="gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Concluir
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
