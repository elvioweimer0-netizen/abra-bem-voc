import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import type { Endomarketing } from "@/types/database";
import { endomarketingTipoLabels } from "@/types/database";
import { Constants } from "@/integrations/supabase/types";

const unidades = Constants.public.Enums.unidade_tipo;
const tipos = ["aniversario", "destaque", "campanha", "mensagem"] as const;

export default function EndomarketingPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Endomarketing[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Endomarketing | null>(null);
  const [form, setForm] = useState({ tipo: "mensagem" as string, titulo: "", descricao: "", unidade: "" as string, data: new Date().toISOString().split("T")[0] });

  const canEdit = profile?.cargo === "admin" || profile?.cargo === "gerente";
  const isAdmin = profile?.cargo === "admin";

  const fetchData = async () => {
    const { data } = await supabase.from("endomarketing").select("*").order("data", { ascending: false });
    setItems((data as Endomarketing[]) || []);
  };

  useEffect(() => { if (profile) fetchData(); }, [profile]);

  const resetForm = () => {
    setForm({ tipo: "mensagem", titulo: "", descricao: "", unidade: "", data: new Date().toISOString().split("T")[0] });
    setEditing(null);
  };

  const openEdit = (item: Endomarketing) => {
    setEditing(item);
    setForm({ tipo: item.tipo, titulo: item.titulo, descricao: item.descricao || "", unidade: item.unidade || "", data: item.data });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const unidadeValue = form.unidade && form.unidade !== "geral" ? form.unidade as typeof profile.unidade : null;
    const payload = {
      tipo: form.tipo as "aniversario" | "destaque" | "campanha" | "mensagem",
      titulo: form.titulo,
      descricao: form.descricao || null,
      unidade: unidadeValue,
      data: form.data,
    };

    if (editing) {
      const { error } = await supabase.from("endomarketing").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Atualizado!");
    } else {
      const { error } = await supabase.from("endomarketing").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Criado com sucesso!");
    }
    setOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("endomarketing").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído!");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" /> Endomarketing
          </h1>
          <p className="text-muted-foreground text-sm">Aniversários, destaques, campanhas e mensagens</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo Endomarketing"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (<SelectItem key={t} value={t}>{endomarketingTipoLabels[t]}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                <Textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                  <SelectTrigger><SelectValue placeholder="Unidade (geral se vazio)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral (todas)</SelectItem>
                    {(isAdmin ? unidades : [profile!.unidade]).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full">{editing ? "Salvar" : "Criar"}</Button>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Data</TableHead>
                {canEdit && <TableHead className="w-24">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum registro.</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant="outline">{endomarketingTipoLabels[item.tipo]}</Badge></TableCell>
                  <TableCell className="font-medium">{item.titulo}</TableCell>
                  <TableCell>{item.unidade || "Geral"}</TableCell>
                  <TableCell>{new Date(item.data).toLocaleDateString("pt-BR")}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
