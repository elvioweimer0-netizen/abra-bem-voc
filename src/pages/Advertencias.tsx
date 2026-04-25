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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Colaborador = Tables<"colaboradores">;

export default function Advertencias() {
  const { profile } = useAuth();
  const [advertencias, setAdvertencias] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    colaborador_id: "", tipo: "verbal" as Enums<"advertencia_tipo">, motivo: "", descricao: "", data: new Date().toISOString().split("T")[0], responsavel: "",
  });

  const canEdit = profile?.cargo !== "colaborador";

  const fetchData = async () => {
    const [advs, colabs] = await Promise.all([
      supabase.from("advertencias").select("*, colaboradores(nome)").order("data", { ascending: false }),
      supabase.from("colaboradores").select("*").order("nome"),
    ]);
    setAdvertencias(advs.data || []);
    setColaboradores(colabs.data || []);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("advertencias").insert({
      ...form,
      unidade: profile.unidade,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Advertência cadastrada!");
    setOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-warning" /> Advertências</h1>
          <p className="text-muted-foreground">Gerenciar advertências de colaboradores</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Nova Advertência</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Advertência</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select value={form.colaborador_id} onValueChange={(v) => setForm({ ...form, colaborador_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Enums<"advertencia_tipo"> })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verbal">Verbal</SelectItem>
                      <SelectItem value="escrita">Escrita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-6">
          <div className="space-y-3 md:hidden">
            {advertencias.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma advertência encontrada.</p>
            ) : advertencias.map((a) => (
              <article key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{a.colaboradores?.nome || "—"}</h3>
                  <Badge variant={a.tipo === "verbal" ? "secondary" : "destructive"}>{a.tipo}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString("pt-BR")} · {a.responsavel}</p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.motivo}</p>
              </article>
            ))}
          </div>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertencias.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma advertência encontrada.</TableCell></TableRow>
              ) : (
                advertencias.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.colaboradores?.nome || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.tipo === "verbal" ? "secondary" : "destructive"}>{a.tipo}</Badge>
                    </TableCell>
                    <TableCell>{a.motivo}</TableCell>
                    <TableCell>{new Date(a.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{a.responsavel}</TableCell>
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
