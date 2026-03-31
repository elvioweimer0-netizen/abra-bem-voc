import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Constants, type Tables, type Enums } from "@/integrations/supabase/types";
import { Building, Plus, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Colaborador = Tables<"colaboradores">;
type Ocorrencia = Tables<"ocorrencias">;

const setores = Constants.public.Enums.setor_tipo;
const setorLabels: Record<string, string> = {
  acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti",
  mercearia: "Mercearia", frente_de_caixa: "Frente de Caixa", deposito: "Depósito",
};
const statusLabels: Record<string, string> = {
  aberta: "Aberta", em_andamento: "Em Andamento", concluida: "Concluída",
};

export default function Departamentos() {
  const { profile } = useAuth();
  const [setor, setSetor] = useState<Enums<"setor_tipo">>("acougue");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ descricao: "", data: new Date().toISOString().split("T")[0] });

  const fetchData = async () => {
    const [colabs, ocors] = await Promise.all([
      supabase.from("colaboradores").select("*").eq("setor", setor).order("nome"),
      supabase.from("ocorrencias").select("*").eq("setor", setor).order("data", { ascending: false }),
    ]);
    setColaboradores(colabs.data || []);
    setOcorrencias(ocors.data || []);
  };

  useEffect(() => { fetchData(); }, [setor, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("ocorrencias").insert({
      setor,
      descricao: form.descricao,
      data: form.data,
      unidade: profile.unidade,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ocorrência registrada!");
    setOpen(false);
    setForm({ descricao: "", data: new Date().toISOString().split("T")[0] });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building className="w-6 h-6 text-primary" /> Departamentos</h1>
          <p className="text-muted-foreground">Visualizar setores e ocorrências</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Ocorrência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Ocorrência - {setorLabels[setor]}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Registrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {setores.map((s) => (
          <Button key={s} variant={setor === s ? "default" : "outline"} size="sm" onClick={() => setSetor(s)}>
            {setorLabels[s]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Equipe - {setorLabels[setor]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {colaboradores.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum colaborador neste setor.</p>
            ) : (
              <div className="space-y-2">
                {colaboradores.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.cargo}</p>
                    </div>
                    <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-warning" />
              Ocorrências - {setorLabels[setor]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ocorrencias.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma ocorrência neste setor.</p>
            ) : (
              <div className="space-y-2">
                {ocorrencias.map((o) => (
                  <div key={o.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{o.descricao}</p>
                      <Badge variant={o.status === "concluida" ? "default" : o.status === "em_andamento" ? "secondary" : "destructive"} className="shrink-0">
                        {statusLabels[o.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(o.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
