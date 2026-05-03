import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Plus, Eye, EyeOff } from "lucide-react";
import { milestoneLabel, milestoneYears } from "@/hooks/useUpcomingMilestones";
import { format, parseISO } from "date-fns";

const TYPES = ["1_year", "3_years", "5_years", "10_years", "20_years", "promotion", "first_day"];

export default function MilestonesAdmin() {
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["admin-milestones", filterType],
    queryFn: async () => {
      let query = supabase
        .from("milestone_celebrations")
        .select("*")
        .order("milestone_date", { ascending: false })
        .limit(200);
      if (filterType !== "all") query = query.eq("milestone_type", filterType);
      const { data, error } = await query;
      if (error) throw error;
      const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
      if (!userIds.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, unidade")
        .in("user_id", userIds);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((m) => ({ ...m, profile: map.get(m.user_id) }));
    },
  });

  const toggleVisible = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase
        .from("milestone_celebrations")
        .update({ post_visible: visible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-milestones"] });
      toast.success("Atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Marcos de Tempo
          </h1>
          <p className="text-sm text-muted-foreground">Visualizar, forçar e cancelar marcos automáticos</p>
        </div>
        <ForceMilestoneDialog onCreated={() => qc.invalidateQueries({ queryKey: ["admin-milestones"] })} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-60">
            <Label>Tipo</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{milestoneLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
          ) : !milestones?.length ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum marco encontrado</div>
          ) : (
            <div className="divide-y">
              {milestones.map((m: any) => {
                const years = milestoneYears(m.milestone_type);
                return (
                  <div key={m.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{m.profile?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.profile?.unidade ?? ""} • {format(parseISO(m.milestone_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={years && years >= 10 ? "default" : "secondary"}>
                        {milestoneLabel(m.milestone_type)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleVisible.mutate({ id: m.id, visible: !m.post_visible })}
                      >
                        {m.post_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ForceMilestoneDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("1_year");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ["force-milestone-profiles"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, nome").eq("ativo", true).order("nome").limit(500);
      return data ?? [];
    },
  });

  async function submit() {
    if (!userId) return toast.error("Selecione um colaborador");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-milestones", {
        body: { force: true, user_id: userId, milestone_type: type, milestone_date: date },
      });
      if (error) throw error;
      toast.success("Marco criado");
      onCreated();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Forçar marco</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar marco manualmente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Colaborador</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {profiles?.map((p) => p.user_id && (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{milestoneLabel(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading}>{loading ? "Criando…" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
