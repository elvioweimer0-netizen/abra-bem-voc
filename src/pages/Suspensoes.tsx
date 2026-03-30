import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";
import { Plus, Ban } from "lucide-react";
import { toast } from "sonner";

type Colaborador = Tables<"colaboradores">;

export default function Suspensoes() {
  const { profile } = useAuth();
  const [suspensoes, setSuspensoes] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    colaborador_id: "", motivo: "",
    data_inicio: new Date().toISOString().split("T")[0],
    data_fim: new Date().toISOString().split("T")[0],
    responsavel: "",
  });

  const canEdit = profile?.cargo !== "colaborador";

  const fetchData = async () => {
    const [susps, colabs] = await Promise.all([
      supabase.from("suspensoes").select("*, colaboradores(nome)").order("data_inicio", { ascending: false }),
      supabase.from("colaboradores").select("*").order("nome"),
    ]);
    setSuspensoes(susps.data || []);
    setColaboradores(colabs.data || []);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("suspensoes").insert({
      ...form,
      unidade: profile.unidade,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Suspensão cadastrada!");
    setOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ban className="w-6 h-6 text-destructive" /> Suspensões</h1>
          <p className="text-muted-foreground">Gerenciar suspensões de colaboradores</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nova Suspensão</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Suspensão</DialogTitle></DialogHeader>
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
                  <Label>Motivo</Label>
                  <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspensoes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma suspensão encontrada.</TableCell></TableRow>
              ) : (
                suspensoes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.colaboradores?.nome || "—"}</TableCell>
                    <TableCell>{s.motivo}</TableCell>
                    <TableCell>{new Date(s.data_inicio).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{new Date(s.data_fim).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{s.responsavel}</TableCell>
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
