import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Constants, type Tables, type Enums } from "@/integrations/supabase/types";
import { Plus, Users, Search } from "lucide-react";
import { toast } from "sonner";

type Colaborador = Tables<"colaboradores">;
const setores = Constants.public.Enums.setor_tipo;
const setorLabels: Record<string, string> = {
  acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti",
  mercearia: "Mercearia", frente_de_caixa: "Frente de Caixa", deposito: "Depósito",
};

export default function Colaboradores() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", matricula: "", cargo: "colaborador" as Enums<"cargo_tipo">, setor: "acougue" as Enums<"setor_tipo"> });

  const canEdit = profile?.cargo === "admin" || profile?.cargo === "gerente";

  const fetchData = async () => {
    const { data } = await supabase.from("colaboradores").select("*").order("nome");
    setColaboradores(data || []);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("colaboradores").insert({
      ...form,
      unidade: profile.unidade,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Colaborador cadastrado!");
    setOpen(false);
    setForm({ nome: "", matricula: "", cargo: "colaborador" as Enums<"cargo_tipo">, setor: "acougue" as Enums<"setor_tipo"> });
    fetchData();
  };

  const filtered = colaboradores.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.matricula.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Colaboradores</h1>
          <p className="text-muted-foreground">Gerenciar colaboradores da unidade</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Novo Colaborador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Colaborador</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Matrícula</Label>
                  <Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select value={form.cargo} onValueChange={(v) => setForm({ ...form, cargo: v as Enums<"cargo_tipo"> })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="lider_setor">Líder de Setor</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="encarregado">Encarregado</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select value={form.setor} onValueChange={(v) => setForm({ ...form, setor: v as Enums<"setor_tipo"> })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {setores.map((s) => <SelectItem key={s} value={s}>{setorLabels[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
            ) : filtered.map((c) => (
              <button key={c.id} className="w-full rounded-xl border border-border bg-card p-4 text-left" onClick={() => navigate(`/colaboradores/${c.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{c.nome}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Matrícula {c.matricula} · {setorLabels[c.setor] || c.setor}</p>
                  </div>
                  <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground capitalize">{c.cargo}</p>
              </button>
            ))}
          </div>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum colaborador encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/colaboradores/${c.id}`)}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.matricula}</TableCell>
                    <TableCell>{c.cargo}</TableCell>
                    <TableCell>{setorLabels[c.setor] || c.setor}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ativo" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
